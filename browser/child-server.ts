// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// What every suite that starts a server as a child process shares: a port the system has just
// handed out, rather than a random one that may be taken, and the reason a server gave when it
// exited before it listened.
import type { ChildProcess } from "node:child_process";
import { createServer } from "node:net";

/** A port nothing was listening on a moment ago, as a string for the environment. */
export const freePort = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close(() => resolve(String(port)));
    });
  });

/** What a child wrote to its piped stderr and nothing has read, for an error that explains. */
export const saidBy = (child: ChildProcess | undefined): string => {
  const said = String(child?.stderr?.read() ?? "").trim();
  return said === "" ? "" : `: ${said}`;
};
