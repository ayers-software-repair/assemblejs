// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { planAssembly, realIo } from "@assemblejs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { ToolResult } from "../server/tool-result.js";

/**
 * Writes an assembly for a named renderer, through the command line's own decision, and answers
 * with every file written and the tag that places it, because an assembly nobody placed is the
 * commonest half-finished state there is.
 */
export function addAssembly(root: ProjectRoot, name: string, renderer: string): ToolResult {
  const plan = planAssembly(
    name,
    renderer,
    existsSync(withinRoot(root, "src", "assemblies", name)),
  );
  if ("problem" in plan) return { ok: false, result: null, problems: [plan.problem] };
  const written: string[] = [];
  for (const [path, contents] of Object.entries(plan.files)) {
    realIo.write(withinRoot(root, path), contents);
    written.push(path);
  }
  return {
    ok: true,
    result: { written, tag: plan.tag },
    problems: [],
    next: [`place it with place_assembly, or by writing ${plan.tag} into a page template`],
  };
}
