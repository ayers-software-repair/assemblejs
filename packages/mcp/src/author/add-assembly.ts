// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DeadLinkError, isOccupied, realIo, rendererProblems } from "@asmjs/build";
import { planAssembly } from "@asmjs/cli";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import type { ToolResult } from "../server/tool-result.js";

/**
 * Writes an assembly for a named renderer, through the command line's own decision, and answers
 * with every file written and the tag that places it, because an assembly nobody placed is the
 * commonest half-finished state there is. Where the project has not installed what the view's
 * renderer needs, installing it is the first thing said to do next, as `check` would refuse the
 * view until it is.
 */
export function addAssembly(root: ProjectRoot, name: string, renderer: string): ToolResult {
  // The name is judged before it is ever joined onto a path, so "../x" is refused with its fix
  // rather than reaching the root guard as a path.
  const judged = planAssembly(name, renderer, false);
  if ("problem" in judged) return { ok: false, result: null, problems: [judged.problem] };
  // A link to nothing where the assembly would stand holds its name, as anything there does.
  let taken = true;
  try {
    taken = isOccupied(withinRoot(root, "src", "assemblies", name));
  } catch (error) {
    if (!(error instanceof DeadLinkError)) throw error;
  }
  const plan = planAssembly(name, renderer, taken);
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
    next: [
      ...rendererProblems(root.path, name, renderer, written[0] ?? "").map(
        (problem) => `${problem.fix}: ${problem.message}`,
      ),
      `place it with place_assembly, or by writing ${plan.tag} into a page template`,
    ],
  };
}
