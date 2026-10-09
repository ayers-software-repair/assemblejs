// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PageBudgets } from "@assemblejs/core";
import { buildProject } from "../build/build-project.js";
import { pageRoute } from "../check/page-route.js";
import type { RunningServer } from "../dev/running-server.js";
import { startServer } from "../dev/start-server.js";
import { discoverPages } from "../discovery/discover-pages.js";
import type { Io } from "../io/io.js";
import { formatWeight } from "./format-weight.js";
import { freePort } from "./free-port.js";
import { measurePage } from "./measure-page.js";
import { overBudget } from "./over-budget.js";
import { readBudgets } from "./read-budgets.js";

/**
 * The `perf` verb: builds the project, starts the built server in production on a free port,
 * and reports what each page sends a visitor before anything mounts, one line per page, at the
 * route the built server mounts it at, and holds each to the budgets `assemblejs.config.ts`
 * declares, gzipped, by part. What it measures is what production serves, from the server
 * production runs. A page that does not answer, answers an assembly with its fallback, is over a
 * budget, or has a route only running the project could tell, is a failure, and the command
 * exits 1; so is a budget it cannot read. A page whose route has a parameter has no one url to
 * weigh, so it is reported as not weighed rather than weighed at a value this command invented.
 * The server it started is stopped however the command ends, a signal included.
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
  // The budgets first: one that cannot be read is known before anything is built or started.
  const configFile = join(root, "assemblejs.config.ts");
  let budgets: PageBudgets = {};
  if (existsSync(configFile)) {
    try {
      const read = readBudgets(readFileSync(configFile, "utf8"));
      for (const problem of read.problems) io.error(`assemblejs.config.ts: ${problem}`);
      if (read.problems.length > 0) return 1;
      budgets = read.budgets;
    } catch (error) {
      io.error(
        `assemblejs.config.ts could not be read: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 1;
    }
  }
  if ((await build(root, io)) !== 0) return 1;
  const { pages } = discoverPages(join(root, "src", "pages"));
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
      try {
        const route = pageRoute(root, page);
        if (route === undefined)
          throw new Error("its route is computed, so only running the project could tell it");
        if (route.includes("/:")) {
          io.log(`${route}: not weighed, as a parameter needs a value`);
          continue;
        }
        const weight = await measurePage(origin, route, signal);
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
