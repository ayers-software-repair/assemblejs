// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Io } from "../io/io.js";
import { checkProject } from "./check-project.js";

/**
 * The `check` verb: every problem `checkProject` finds, one per line with its file, what is
 * wrong, its rule and its fix, and exit 1 when there is any. Nothing is built or started;
 * template views are compiled, with the project's own engines, and nothing is written.
 */
export async function runCheck(root: string, io: Io): Promise<number> {
  const problems = await checkProject(root);
  for (const problem of problems) {
    io.error(`${problem.path}: ${problem.message} (${problem.rule}): ${problem.fix}`);
  }
  if (problems.length > 0) {
    io.error(`${problems.length} problem(s)`);
    return 1;
  }
  io.log("no problems");
  return 0;
}
