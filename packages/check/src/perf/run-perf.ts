// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { RunningServer } from "@asmjs/build";
import type { Io } from "@asmjs/build";
import { buildProject } from "@asmjs/build";
import { startServer } from "@asmjs/build";
import { CONFIG_FILE } from "@asmjs/build";
import { discoverPages } from "@asmjs/build";
import { freePort } from "@asmjs/build";
import { NOT_FOUND_PAGE } from "@asmjs/build";
import { routeParameters } from "@asmjs/core";
import type { PageAddresses, PageBudgets } from "@asmjs/core";
import { pageRoute } from "../check/page-route.js";
import { formatWeight } from "./format-weight.js";
import { measurePage } from "./measure-page.js";
import { overBudget } from "./over-budget.js";
import { readAddresses } from "./read-addresses.js";
import { readBudgets } from "./read-budgets.js";

/**
 * The `perf` verb: builds the project, starts the built server in production on a free port,
 * and reports what each page sends a visitor before anything mounts and as its assemblies
 * mount, one line per page, at the route the built server mounts it at, and holds each to the
 * budgets `assemblejs.config.ts` declares, gzipped, by part. A page that does not answer,
 * answers an assembly with its fallback, is over a budget, or has a route only running the
 * project could tell, is a failure, and the command exits 1; so is a budget or an address it
 * cannot read. A page whose route has a parameter is weighed at its address in `addresses`,
 * and is reported as not weighed without one; so is a page the project guards. The server it
 * started is stopped however the command ends, a signal included.
 */
export async function runPerf(
  root: string,
  io: Io,
  options: {
    readonly build?: (root: string, io: Io) => Promise<number>;
    readonly start?: (root: string, io: Io, env: Readonly<Record<string, string>>) => RunningServer;
    readonly signal?: AbortSignal;
  } = {},
): Promise<number> {
  const { build = buildProject, signal } = options;
  const start = options.start ?? ((at, quiet, env) => startServer(at, quiet, 3000, env));
  // The budgets and addresses first: one that cannot be read is known before anything is built
  // or started.
  const configFile = join(root, CONFIG_FILE);
  let budgets: PageBudgets = {};
  let addresses: PageAddresses = {};
  if (existsSync(configFile)) {
    try {
      const source = readFileSync(configFile, "utf8");
      const read = await readBudgets(source);
      const declared = await readAddresses(source);
      for (const problem of [...read.problems, ...declared.problems]) {
        io.error(`assemblejs.config.ts: ${problem}`);
      }
      if (read.problems.length + declared.problems.length > 0) return 1;
      budgets = read.budgets;
      addresses = declared.addresses;
    } catch (error) {
      io.error(
        `assemblejs.config.ts could not be read: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 1;
    }
  }
  if ((await build(root, io)) !== 0) return 1;
  const { pages } = discoverPages(root);
  const port = await freePort();
  const server = start(
    root,
    { ...io, log: () => undefined },
    {
      ASSEMBLEJS_MODE: "production",
      ASSEMBLEJS_PORT: String(port),
    },
  );
  // Read afresh each time: an interrupt can arrive while a page is being weighed.
  const interrupted = (): boolean => signal?.aborted === true;
  const stopped = new Promise<"stopped">((resolve) => {
    if (signal?.aborted === true) resolve("stopped");
    signal?.addEventListener("abort", () => resolve("stopped"), { once: true });
  });
  try {
    const origin = await Promise.race([server.ready, stopped]);
    if (origin === "stopped") return 130;
    if (origin === undefined) {
      io.error("the built server stopped before it listened");
      return 1;
    }
    let failed = 0;
    for (const page of pages) {
      if (interrupted()) return 130;
      if (page.name === NOT_FOUND_PAGE) {
        io.log(`${page.name}: not weighed, as it has no address of its own`);
        continue;
      }
      try {
        const route = await pageRoute(root, page);
        if (route === undefined)
          throw new Error(
            "its route is not written as a literal, so only running the project could tell it",
          );
        const parameterised = routeParameters(route).length > 0;
        const address =
          parameterised && Object.hasOwn(addresses, route) ? addresses[route] : undefined;
        if (parameterised && address === undefined) {
          io.log(
            `${route}: not weighed, as a parameter needs a value; add "${route}" to addresses in ${CONFIG_FILE}`,
          );
          continue;
        }
        const weight = await measurePage(origin, route, signal, address);
        if (weight === undefined) {
          io.log(`${route}: not weighed, as it is not shown to a visitor who has not signed in`);
          continue;
        }
        io.log(formatWeight(weight));
        for (const url of weight.elsewhere) io.log(`  not weighed, from another origin: ${url}`);
        if (weight.fellBack.length > 0) {
          throw new Error(`${route} answered with the fallback of ${weight.fellBack.join(", ")}`);
        }
        const over = overBudget(weight, budgets);
        for (const line of over) io.error(`page "${page.name}": ${line}`);
        if (over.length > 0) failed += 1;
      } catch (error) {
        // A request abandoned for an interrupt is the interrupt, not the page's failure.
        if (interrupted()) return 130;
        failed += 1;
        io.error(`page "${page.name}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return failed === 0 ? 0 : 1;
  } finally {
    await server.stop();
  }
}
