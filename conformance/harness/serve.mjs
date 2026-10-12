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

// What a server's process loads before its own code: it ends when the channel to the process
// that started it closes, which is when that process is gone, however it went. A run stopped by
// a signal stops its servers itself; one killed outright runs no line of its own, and without
// this every server it had started would go on listening with nothing to stop it. Unreferenced,
// so a server that closes by itself still ends by itself.
const WITH_ITS_STARTER = `data:text/javascript,${encodeURIComponent(
  'if(process.channel!==undefined){process.on("disconnect",()=>process.exit(0));process.channel.unref();}',
)}`;

/**
 * A built project's server as a child of this process, under the environment given, with its
 * output to read: the one way a harness or a spec starts one, so that none outlives what
 * started it.
 */
export const spawned = (root, env) =>
  spawn(process.execPath, ["--import", WITH_ITS_STARTER, "dist/server.js"], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

/**
 * Starts the server, handing `track` the means to stop it the moment it is spawned, and answers
 * its origin once it listens.
 */
export async function serve(root, env = {}, track = () => undefined) {
  const port = String(await freePort());
  const child = spawned(root, {
    ...process.env,
    ...env,
    ASSEMBLEJS_MODE: "production",
    ASSEMBLEJS_PORT: port,
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
  const handle = { origin: "", log, stop };
  track(handle);
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
    handle.origin = origin;
    return handle;
  } catch (error) {
    await stop();
    throw error;
  }
}
