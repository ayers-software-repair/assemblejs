// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildProject } from "../build/build-project.js";
import type { Io } from "../io/io.js";
import type { RunningServer } from "./running-server.js";
import { startServer } from "./start-server.js";
import { watchSources } from "./watch-sources.js";

/**
 * Builds the project, runs the built server, and on every change to `src/` or to
 * `assemblejs.config.ts` builds again and restarts it: the same build and the same `node dist/server.js` production runs, so nothing
 * that works here can fail there for a reason dev hid.
 *
 * A build that fails, or throws, leaves the last good server running and says why; the next save
 * tries again. Each step ends once the server is spawned, never waiting on what the server
 * prints, so a server that is slow to listen or never says so holds nothing up. When the signal
 * aborts (Ctrl-C at a terminal) the server is stopped first, then the command ends. Only a server
 * that exits on its own is reported as stopped; one dev stopped itself is not.
 */
export async function runDev(
  root: string,
  io: Io,
  signal: AbortSignal,
  build: (root: string, io: Io) => Promise<number> = buildProject,
): Promise<number> {
  let server: RunningServer | undefined;
  let queue = Promise.resolve();

  const step = async (): Promise<void> => {
    if (signal.aborted) return;
    if ((await build(root, io)) !== 0) {
      io.error(server === undefined ? "waiting for a fix" : "the last good build is still running");
      return;
    }
    const previous = server;
    server = undefined;
    await previous?.stop();
    if (signal.aborted) return;
    const started = startServer(root, io);
    server = started;
    void started.ready.then((url) => {
      if (url === undefined && server === started)
        io.error("the server stopped; waiting for a change");
    });
  };
  const rebuild = (): Promise<void> =>
    (queue = queue.then(step).catch((error: unknown) => {
      io.error(
        `the build could not run: ${error instanceof Error ? error.message : String(error)}`,
      );
    }));

  if (!existsSync(join(root, "src"))) {
    io.error("there is no src/ here to build or watch; run dev from a project's root");
    return 1;
  }
  await rebuild();
  const stops = [
    watchSources(join(root, "src"), () => void rebuild()),
    watchSources(root, () => void rebuild(), 100, "assemblejs.config.ts"),
  ];
  await new Promise<void>((resolve) => {
    if (signal.aborted) resolve();
    else signal.addEventListener("abort", () => resolve(), { once: true });
  });
  for (const stop of stops) stop();
  const ending = async (): Promise<void> => {
    const last = server;
    server = undefined;
    await last?.stop();
  };
  await ending();
  await queue;
  await ending();
  return 0;
}
