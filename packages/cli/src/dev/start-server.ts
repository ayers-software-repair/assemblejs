// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { join } from "node:path";
import type { Io } from "../io/io.js";
import type { RunningServer } from "./running-server.js";

/**
 * Starts `dist/server.js` under plain node, as production does, in development mode unless the
 * environment says otherwise. Its output is passed through line by line, so what the server logs
 * reads in the same terminal as what the build said. Stopping asks it to end, and after
 * `graceMs` makes it, so a server that ignores the request cannot hold dev open.
 */
export function startServer(root: string, io: Io, graceMs = 3000): RunningServer {
  const child = spawn(process.execPath, [join(root, "dist", "server.js")], {
    cwd: root,
    env: { ASSEMBLEJS_MODE: "development", ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
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
    child.stdout.on("data", (chunk: Buffer) => {
      for (const line of String(chunk)
        .split("\n")
        .filter((text) => text !== "")) {
        io.log(line);
        const found = /listening (http:\/\/\S+)/.exec(line);
        if (found?.[1] !== undefined) resolve(found[1]);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      for (const line of String(chunk)
        .split("\n")
        .filter((text) => text !== ""))
        io.error(line);
    });
    void exited.then(() => resolve(undefined));
  });
  return {
    ready,
    stop: async () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill();
      const forced = setTimeout(() => child.kill("SIGKILL"), graceMs);
      await exited;
      clearTimeout(forced);
    },
  };
}
