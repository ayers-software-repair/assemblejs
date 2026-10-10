// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { resolve } from "node:path";
import type { ProjectRoot } from "./project-root.js";
import { resolveRoot } from "./resolve-root.js";

/**
 * The one project root a server works on, from how it was started: the directory given as its
 * one argument, by a client that hands its workspace over that way; else the one Claude Code
 * names in a server's environment as `CLAUDE_PROJECT_DIR`, which its documentation gives a
 * server to find the project by whatever directory it runs in; else the directory it was
 * started in. A relative one is taken from where the server was started.
 */
export function startedRoot(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
  cwd: string,
): ProjectRoot {
  const named = [argv[0], env["CLAUDE_PROJECT_DIR"]].find(
    (value) => value !== undefined && value !== "",
  );
  return resolveRoot(resolve(cwd, named ?? "."));
}
