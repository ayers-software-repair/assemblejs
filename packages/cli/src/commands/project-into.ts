// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { agentFiles } from "../agents/agent-files.js";
import { lineEnding } from "../io/line-ending.js";
import { projectFiles } from "./project-files.js";

// What a directory may hold of the starter's own and still take a project: its author's
// README, which is kept as it is, and what git is told to pass over, which is added to.
const KEPT: readonly string[] = ["README.md", ".gitignore"];

/** An entry as it is compared: `dist`, `/dist` and `dist/` tell git to pass over one thing. */
const bare = (line: string): string => line.trim().replace(/^\//, "").replace(/\/$/, "");

/** What git passes over already, with each of the starter's entries it lacks added at its end. */
const passingOver = (theirs: string, starter: string): string => {
  const held = new Set(theirs.split("\n").map(bare));
  const lacked = starter.split("\n").filter((entry) => entry !== "" && !held.has(bare(entry)));
  if (lacked.length === 0) return theirs;
  const ending = lineEnding(theirs);
  return `${theirs.trimEnd()}${theirs.trim() === "" ? "" : ending}${lacked.join(ending)}${ending}`;
};

/**
 * The files that make a project in a directory, given what the directory holds: the starter's
 * own, or what stands in the way of them. One decision, asked by `new` and by the agent
 * surface's `create_project`, so a project is made in the same places by either.
 *
 * A directory need not be empty. What the starter does not write is left alone. A README there
 * is the author's and is kept as it is; a `.gitignore` there keeps every line and gains the
 * starter's entries it lacks, in its own line ending, as a first commit made without them
 * carries the build's output. The files a project carries for its agents are brought up to
 * date as `add agents` does it. Any other file the starter writes, anything under `src`, and
 * anything where one of those goes that is no file to read, is `taken`, and nothing is written
 * over it. A registration that cannot be read is `unreadable`.
 *
 * `held` answers a file's text, undefined for none or for what is no file; `occupied` answers
 * whether anything at all is at a path, a link to nothing included.
 */
export function projectInto(
  name: string,
  manager: string,
  held: (path: string) => string | undefined,
  occupied: (path: string) => boolean,
):
  | { readonly files: Readonly<Record<string, string>> }
  | { readonly taken: readonly string[] }
  | { readonly unreadable: readonly string[] } {
  const starter = projectFiles(name, manager);
  const forAgents = Object.keys(agentFiles(name).files);
  const own = Object.keys(starter).filter((path) => !forAgents.includes(path));
  const taken = [
    ...own.filter((path) => occupied(path) && !(KEPT.includes(path) && held(path) !== undefined)),
    ...forAgents.filter((path) => occupied(path) && held(path) === undefined),
  ];
  if (taken.length === 0 && occupied("src")) taken.push("src/");
  if (taken.length > 0) return { taken };

  const agents = agentFiles(name, held);
  if (agents.unreadable.length > 0) return { unreadable: agents.unreadable };

  const files: Record<string, string> = {};
  for (const path of own) {
    const written = starter[path] ?? "";
    const theirs = KEPT.includes(path) ? held(path) : undefined;
    if (theirs === undefined) files[path] = written;
    else if (path === ".gitignore" && passingOver(theirs, written) !== theirs) {
      files[path] = passingOver(theirs, written);
    }
  }
  return { files: { ...files, ...agents.files } };
}
