// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { basename } from "node:path";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { uncompiled } from "./uncompiled.js";

/**
 * The finding for a source file that does not compile: its name, and what the compiler said of
 * it first, with the line.
 *
 * `check` reads a project without building it, so a file it cannot compile is one whose routes,
 * placements and elements it cannot see. Passed over, such a file left `check` saying no
 * problems of a project the build then stopped on.
 */
export function unreadableSource(path: string, error: unknown): ProjectProblem {
  const [first] = uncompiled(error) ?? [];
  const said =
    first === undefined
      ? error instanceof Error
        ? error.message
        : String(error)
      : `${first.text}${first.line === undefined ? "" : ` (line ${String(first.line)})`}`;
  return {
    path,
    rule: "a-source-file-compiles",
    message: `${basename(path)} does not compile: ${said}`,
    fix: "correct it; until it compiles, nothing else about it can be checked",
  };
}
