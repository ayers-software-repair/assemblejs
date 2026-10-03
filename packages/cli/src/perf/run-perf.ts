// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { buildProject } from "../build/build-project.js";
import { startServer } from "../dev/start-server.js";
import { discoverPages } from "../discovery/discover-pages.js";
import type { Io } from "../io/io.js";
import { formatWeight } from "./format-weight.js";
import { freePort } from "./free-port.js";
import { measurePage } from "./measure-page.js";

/**
 * The `perf` verb: builds the project, starts the built server in production on a free port,
 * and reports what each page sends a visitor before anything mounts, one line per page. What it
 * measures is what production serves, from the server production runs. A page that does not
 * answer is a failure, and the command exits 1.
 */
export async function runPerf(
  root: string,
  io: Io,
  build: (root: string, io: Io) => Promise<number> = buildProject,
): Promise<number> {
  if ((await build(root, io)) !== 0) return 1;
  const { pages } = discoverPages(join(root, "src", "pages"));
  const port = await freePort();
  const quiet: Io = { ...io, log: () => undefined };
  const server = startServer(root, quiet, 3000, {
    ASSEMBLEJS_MODE: "production",
    ASSEMBLEJS_PORT: String(port),
  });
  try {
    const origin = await server.ready;
    if (origin === undefined) {
      io.error("the built server stopped before it listened");
      return 1;
    }
    let failed = 0;
    for (const page of pages) {
      try {
        io.log(formatWeight(await measurePage(origin, page.route)));
      } catch (error) {
        failed += 1;
        io.error(`${page.route}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return failed === 0 ? 0 : 1;
  } finally {
    await server.stop();
  }
}
