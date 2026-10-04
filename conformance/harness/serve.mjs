// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Starts a built project's server under plain node, in production, on a port the system gives,
// with whatever else `env` tells it, and answers its origin and how to stop it. A server that does not come up is stopped before
// the failure is reported, so no run leaves one behind.
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { join } from "node:path";
import { createServer } from "node:net";

/** A port nothing was listening on a moment ago. */
export const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

export async function serve(root, env = {}) {
  const port = String(await freePort());
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: root,
    env: { ...process.env, ...env, ASSEMBLEJS_MODE: "production", ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  // Everything the server writes, its log lines among it, kept beside it for a spec to read.
  const log = join(root, "server.log");
  const written = createWriteStream(log);
  child.stdout.pipe(written);
  child.stderr.pipe(written);
  const exited = new Promise((resolve) => child.once("exit", resolve));
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await exited;
  };
  try {
    const origin = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("the server did not listen within 30s")),
        30_000,
      );
      child.stdout.on("data", (chunk) => {
        const found = /listening (http:\/\/\S+)/.exec(String(chunk));
        if (found) {
          clearTimeout(timer);
          resolve(found[1]);
        }
      });
      child.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`the server exited with ${code}`));
      });
    });
    return { origin, stop, log };
  } catch (error) {
    await stop();
    throw error;
  }
}
