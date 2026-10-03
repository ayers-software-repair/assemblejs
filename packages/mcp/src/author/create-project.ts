// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { projectFiles, realIo, suggestName } from "@assemblejs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { ToolResult } from "../server/tool-result.js";

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Scaffolds the smallest project that runs into the project root, through the command line's own
 * files. Only into a root that holds no project yet: scaffolding over one would overwrite the
 * author's files with a starter's.
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
  if (existsSync(withinRoot(root, "package.json"))) {
    return {
      ok: false,
      result: null,
      problems: [
        {
          path: "package.json",
          rule: "one-project-per-root",
          message: "this root already holds a project",
          fix: "add to it with add_assembly instead",
        },
      ],
    };
  }
  const written: string[] = [];
  for (const [path, contents] of Object.entries(projectFiles(name))) {
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
