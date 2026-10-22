// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { join } from "node:path";
import type { Io } from "../io/io.js";
import type { RunningServer } from "./running-server.js";

// What the server's process loads before its own code: it ends when the channel to this
// process closes, which is when this process is gone, however it went. A signal this process
// hears, it answers by stopping the server; one that kills it outright runs no line of its
// own, and without this the server would go on listening on its port with nothing to stop it.
// Unreferenced, so a server that closes by itself still ends by itself.
const WITH_ITS_STARTER = `data:text/javascript,${encodeURIComponent(
  'if(process.channel!==undefined){process.on("disconnect",()=>process.exit(0));process.channel.unref();}',
)}`;

/**
 * Starts `dist/server.js` under node, as production does, in development mode unless the
 * environment says otherwise; what `env` names is set over both, which is how a caller that
 * measures production fixes the mode and the port. Its output is passed through line by line,
 * so what the server logs reads in the same terminal as what the build said. Stopping asks it to
 * end, and after `graceMs` makes it, so a server that ignores the request cannot hold dev open.
 * And it does not outlive this process: killed outright, with no chance to stop anything, this
 * process still takes the server with it.
 */
export function startServer(
  root: string,
  io: Io,
  graceMs = 3000,
  env: Readonly<Record<string, string>> = {},
): RunningServer {
  const child = spawn(
    process.execPath,
    ["--import", WITH_ITS_STARTER, join(root, "dist", "server.js")],
    {
      cwd: root,
      env: { ASSEMBLEJS_MODE: "development", ...process.env, ...env },
      // The fourth is the channel the server's process ends by, when this one is gone.
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    },
  );
  // A last resort: if this process exits, the server it started goes with it, at once.
  const orphaned = (): void => {
    child.kill("SIGKILL");
  };
  process.once("exit", orphaned);
  const exited = new Promise<void>((resolve) =>
    child.once("exit", () => {
      process.removeListener("exit", orphaned);
      resolve();
    }),
  );
  const ready = new Promise<string | undefined>((resolve) => {
    child.stdout?.on("data", (chunk: Buffer) => {
      for (const line of String(chunk)
        .split("\n")
        .filter((text) => text !== "")) {
        io.log(line);
        const found = /listening (http:\/\/\S+)/.exec(line);
        if (found?.[1] !== undefined) resolve(found[1]);
      }
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      for (const line of String(chunk)
        .split("\n")
        .filter((text) => text !== ""))
        io.error(line);
    });
    void exited.then(() => resolve(undefined));
  });
  return {
    ready,
    exited,
    stop: async () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill();
      const forced = setTimeout(() => child.kill("SIGKILL"), graceMs);
      await exited;
      clearTimeout(forced);
    },
  };
}
