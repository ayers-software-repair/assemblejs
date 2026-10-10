// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { agentFiles, projectFiles, realIo, suggestName, textIn } from "@assemblejs/cli";
import { isOccupied } from "../root/is-occupied.js";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { ToolResult } from "../server/tool-result.js";

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Scaffolds the smallest project that runs into the project root, through the command line's own
 * files. Only into a root that holds no project yet, judged by every file of the project's own
 * the starter would write and by `src/`, not by `package.json` alone: scaffolding over one would
 * overwrite the author's files with a starter's.
 *
 * What a project carries for its agents is not a project, and a root may hold some of it
 * already: the registration that started this server, for one. Those files are brought up to
 * date as the command line's `add agents` does it, every server and instruction of the root's
 * own kept, and a registration that cannot be read is refused before anything is written.
 */
export function createProject(root: ProjectRoot, name: string): ToolResult {
  if (!NAME.test(name)) {
    return {
      ok: false,
      result: null,
      problems: [
        {
          path: "package.json",
          rule: "one-project-per-root",
          message: `"${name}" is not a usable package name`,
          fix: `call it "${suggestName(name)}"`,
        },
      ],
    };
  }
  const read = textIn(root.path);
  // Read through the root's guard, like every path a tool touches: a link out of the root is
  // refused before what it leads to is read.
  const held = (path: string): string | undefined => {
    withinRoot(root, path);
    return read(path);
  };
  const starter = projectFiles(name);
  const forAgents = Object.keys(agentFiles(name).files);
  const own = Object.keys(starter).filter((path) => !forAgents.includes(path));
  const present = [
    ...own.filter((path) => isOccupied(withinRoot(root, path))),
    // Something where an agent file goes that is no file to read: a directory, for one.
    ...forAgents.filter((path) => isOccupied(withinRoot(root, path)) && held(path) === undefined),
  ];
  if (present.length > 0 || isOccupied(withinRoot(root, "src"))) {
    return {
      ok: false,
      result: null,
      problems: [
        {
          path: "package.json",
          rule: "one-project-per-root",
          message: `this root already holds a project: ${present.length > 0 ? present.join(", ") : "src/"}`,
          fix: "add to it with add_assembly instead",
        },
      ],
    };
  }
  const agents = agentFiles(name, held);
  if (agents.unreadable.length > 0) {
    return {
      ok: false,
      result: null,
      problems: agents.unreadable.map((path) => ({
        path,
        rule: "agent-instructions-are-current" as const,
        message: `${path} is not JSON, which a comment in it is enough to cause, and a server cannot be added to it without losing what it holds`,
        fix: "correct it or remove it, then create the project again",
      })),
    };
  }
  const written: string[] = [];
  for (const [path, contents] of [
    ...own.map((path) => [path, starter[path] ?? ""] as const),
    ...Object.entries(agents.files),
  ]) {
    realIo.write(withinRoot(root, path), contents);
    written.push(path);
  }
  return {
    ok: true,
    result: { written },
    problems: [],
    next: [
      "install its dependencies",
      "see the page with compose_page, or add a second framework with add_assembly",
    ],
  };
}
