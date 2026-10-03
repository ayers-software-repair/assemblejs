// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Io } from "@assemblejs/cli";
import { run } from "@assemblejs/cli";

const USAGE = "npm create @assemblejs <directory>";

/**
 * What `npm create @assemblejs my-app` does: the command line's own `new`, so a project started
 * either way is the same project. It takes the directory as its one argument and never asks for
 * it, because a starter that prompts is a starter that hangs in a script.
 */
export function createProject(argv: readonly string[], io: Io): number {
  const [directory, ...rest] = argv;
  if (directory === undefined || directory === "" || directory.startsWith("-") || rest.length > 0) {
    io.error(`usage: ${USAGE}`);
    return 2;
  }
  return run(["new", directory], io) as number;
}
