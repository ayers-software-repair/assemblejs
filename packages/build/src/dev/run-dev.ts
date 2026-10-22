// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildProject } from "../build/build-project.js";
import { CONFIG_FILE } from "../discovery/config-file.js";
import type { Io } from "../io/io.js";
import { askedAt } from "./asked-at.js";
import { DEV_RECORD } from "./dev-record.js";
import { folded } from "./folded.js";
import type { RunningServer } from "./running-server.js";
import { startServer } from "./start-server.js";
import { watchSources } from "./watch-sources.js";

/**
 * Builds the project, runs the built server, and on every change to `src/` or to
 * `assemblejs.config.ts` builds again and restarts it: the same build and the same
 * `node dist/server.js` production runs, so nothing that works here can fail there for a reason
 * dev hid.
 *
 * A build that fails, or throws, leaves the last good server running, with every file it runs
 * from, and says why; the next save tries again. A build is made beside the one being served,
 * and the server is stopped only once the new build stands whole, just before it takes the old
 * one's place. Changes made while a build runs are one build more, not one each, and a build
 * the sources moved under is not started: the build after it is of what is there. Each step
 * ends once the server is spawned, never waiting on what the server
 * prints, so a server that is slow to listen or never says so holds nothing up. When the signal
 * aborts (Ctrl-C at a terminal) the server is stopped first, then the command ends. Only a server
 * that exits on its own is reported as stopped; one dev stopped itself is not. While a server
 * runs, `DEV_RECORD` under the root holds its url, for the agent surface to ask it.
 */
export async function runDev(
  root: string,
  io: Io,
  signal: AbortSignal,
  build: (root: string, io: Io, settle?: () => Promise<boolean>) => Promise<number> = buildProject,
): Promise<number> {
  let server: RunningServer | undefined;
  const record = join(root, DEV_RECORD);

  const step = async (stale: () => boolean): Promise<void> => {
    if (signal.aborted) return;
    let replaced = false;
    const built = await build(root, io, async () => {
      // What changed while this build ran is not in it: it is left unused, and the build that
      // follows is of the sources as they are.
      if (stale() || signal.aborted) return false;
      const previous = server;
      server = undefined;
      io.remove(record);
      await previous?.stop();
      replaced = true;
      return true;
    });
    if (built !== 0) {
      io.error(server === undefined ? "waiting for a fix" : "the last good build is still running");
      return;
    }
    if (!replaced || signal.aborted) return;
    const started = startServer(root, io);
    server = started;
    void started.ready.then((url) => {
      if (server !== started || url === undefined) return;
      io.write(record, `${JSON.stringify({ url: askedAt(url) })}\n`);
    });
    void started.exited?.then(() => {
      if (server !== started) return;
      server = undefined;
      io.remove(record);
      io.error("the server stopped; waiting for a change");
    });
  };
  const runs = folded(step);
  const rebuild = (): Promise<void> =>
    runs.again().catch((error: unknown) => {
      io.error(
        `the build could not run: ${error instanceof Error ? error.message : String(error)}`,
      );
    });

  if (!existsSync(join(root, "src"))) {
    io.error("there is no src/ here to build or watch; run dev from a project's root");
    return 1;
  }
  // Watched from before the first build, so a change made while it runs is not missed.
  const stops = [
    watchSources(join(root, "src"), () => void rebuild()),
    watchSources(root, () => void rebuild(), 100, CONFIG_FILE),
  ];
  await rebuild();
  await new Promise<void>((resolve) => {
    if (signal.aborted) resolve();
    else signal.addEventListener("abort", () => resolve(), { once: true });
  });
  for (const stop of stops) stop();
  const ending = async (): Promise<void> => {
    const last = server;
    server = undefined;
    io.remove(record);
    await last?.stop();
  };
  await ending();
  await runs.settled();
  await ending();
  return 0;
}
