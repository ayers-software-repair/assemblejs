// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { posix } from "node:path";
import { instructionsIn } from "./instructions-in.js";

// Where an import is not read: a fenced block, which one never closed runs to the end of the
// file, and a code span.
const FENCED = /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:^ {0,3}\1[^\n]*$|(?![\s\S]))/gm;
const SPAN = /`[^`\n]*`/g;
const IMPORT = /(?:^|\s)@(\S+)/g;

/**
 * Whether one of Claude Code's instruction files brings the project's `AGENTS.md` in: by
 * importing it, an `@` and its path from the file that holds the line, written outside a code
 * span and a fenced block; or by being that file, through a link. `path` is the instruction
 * file's own, from the project's root.
 */
export function bringsInAgents(path: string, text: string): boolean {
  if (instructionsIn(text) !== undefined) return true;
  const prose = text.replace(FENCED, "").replace(SPAN, "");
  return [...prose.matchAll(IMPORT)].some(
    (found) => posix.normalize(posix.join(posix.dirname(path), found[1] ?? "")) === "AGENTS.md",
  );
}
