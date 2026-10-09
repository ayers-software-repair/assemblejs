// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer } from "node:net";

/** A port nothing on this machine is listening on, asked of the system rather than guessed. */
export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}
