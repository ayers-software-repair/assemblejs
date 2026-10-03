// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Starts a built project's server under plain node, in production, on a port the system gives,
// and answers its origin and how to stop it.
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

export async function serve(root) {
  const port = String(await freePort());
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: root,
    env: { ...process.env, ASSEMBLEJS_MODE: "production", ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "inherit"],
  });
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
    child.on("exit", (code) => reject(new Error(`the server exited with ${code}`)));
  });
  return { origin, stop: () => child.kill() };
}
