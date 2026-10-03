// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { buildProject } from "../build/build-project.js";
import type { Io } from "../io/io.js";
import type { RunningServer } from "./running-server.js";
import { startServer } from "./start-server.js";
import { watchSources } from "./watch-sources.js";

/**
 * Builds the project, runs the built server, and on every change to `src/` builds again and
 * restarts it: the same build and the same `node dist/server.js` production runs, so nothing
 * that works here can fail there for a reason dev hid.
 *
 * A build that fails leaves the last good server running and says why; the next save tries
 * again. Ends, stopping the server, when the signal aborts: Ctrl-C at a terminal.
 */
export async function runDev(root: string, io: Io, signal: AbortSignal): Promise<number> {
  let server: RunningServer | undefined;
  let queue = Promise.resolve();

  const rebuild = (): Promise<void> =>
    (queue = queue.then(async () => {
      if (signal.aborted) return;
      if ((await buildProject(root, io)) !== 0) {
        io.error(
          server === undefined ? "waiting for a fix" : "the last good build is still running",
        );
        return;
      }
      await server?.stop();
      if (signal.aborted) return;
      server = startServer(root, io);
      const url = await server.ready;
      if (url === undefined) io.error("the server stopped; waiting for a change");
    }));

  await rebuild();
  const stop = watchSources(join(root, "src"), () => void rebuild());
  await new Promise<void>((resolve) => {
    if (signal.aborted) resolve();
    else signal.addEventListener("abort", () => resolve(), { once: true });
  });
  stop();
  await queue;
  await server?.stop();
  return 0;
}
