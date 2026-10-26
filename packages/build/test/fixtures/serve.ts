// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { freePort, realIo, startServer } from "@asmjs/build";

/**
 * What a built project's server answers at one path.
 *
 * Started on a port the OS has free, not one drawn by chance beside every other suite's server,
 * and saying what it printed should it exit before it listens. Through the dev loop's own
 * starter, in production as a plain start is, so that a run of a suite killed outright leaves no
 * server behind it.
 */
export async function serve(root: string, path: string): Promise<string> {
  const printed: string[] = [];
  const say = (line: string): void => void printed.push(line);
  const server = startServer(root, { ...realIo, log: say, error: say }, 3000, {
    ASSEMBLEJS_MODE: "production",
    ASSEMBLEJS_PORT: String(await freePort()),
  });
  try {
    const origin = await server.ready;
    if (origin === undefined) {
      throw new Error(`exited before it listened:\n${printed.join("\n")}`);
    }
    return await (await fetch(`${origin}${path}`)).text();
  } finally {
    await server.stop();
  }
}
