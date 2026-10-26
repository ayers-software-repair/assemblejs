// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isOccupied, realIo, suggestName } from "@asmjs/build";
import { cannotRegister, textIn } from "@asmjs/check";
import { PROJECT_NAME, projectInto } from "@asmjs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { ToolResult } from "../server/tool-result.js";

/**
 * Scaffolds the smallest project that runs into the project root, through the command line's own
 * decision of what a directory may hold when a project is made in it: a README and a
 * `.gitignore` are kept, what a project carries for its agents is brought up to date as
 * `add agents` does it, every server and instruction of the root's own kept, and any other file
 * the starter would write stands in the way, as scaffolding over one would overwrite the
 * author's files with a starter's. A registration that cannot be read is refused before anything
 * is written.
 *
 * Every path is asked of the root's guard before it is read or written, so a link out of the
 * root is refused before what it leads to is touched.
 */
export function createProject(root: ProjectRoot, name: string): ToolResult {
  if (!PROJECT_NAME.test(name)) {
    return {
      ok: false,
      result: null,
      problems: [
        {
          path: "package.json",
          rule: "one-project-per-root",
          message: `"${name}" is not a usable package name`,
          fix: `call it "${suggestName(name, "my-app")}"`,
        },
      ],
    };
  }
  const read = textIn(root.path);
  const made = projectInto(
    name,
    "npm",
    (path) => {
      withinRoot(root, path);
      return read(path);
    },
    (path) => isOccupied(withinRoot(root, path)),
  );
  if ("taken" in made) {
    // Sent to add an assembly, an agent adds one to a root that holds no project.
    const project = made.taken.includes("package.json");
    return {
      ok: false,
      result: null,
      problems: [
        {
          path: made.taken[0] ?? "package.json",
          rule: "one-project-per-root",
          message: project
            ? `this root already holds a project: ${made.taken.join(", ")}`
            : `this root already holds ${made.taken.join(", ")}, which a new project would write over`,
          fix: project
            ? "add to it with add_assembly instead"
            : "move it aside, or make the project in a root that does not hold it",
        },
      ],
    };
  }
  if ("unreadable" in made) {
    return {
      ok: false,
      result: null,
      problems: made.unreadable.map((path) => ({
        path,
        rule: "agent-instructions-are-current" as const,
        message: cannotRegister(path),
        fix: "correct it or remove it, then create the project again",
      })),
    };
  }
  const written: string[] = [];
  for (const [path, contents] of Object.entries(made.files)) {
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
