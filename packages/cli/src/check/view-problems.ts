// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import { DEFAULT_VIEW, placedBeneath, viewPlacementProblems } from "@assemblejs/core";
import type { PlacedAssembly } from "@assemblejs/core";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { readViewExport } from "./read-view-export.js";

/**
 * Everything wrong with what the views of a project place, by the rules boot refuses them by
 * and one more that only a browser would otherwise tell: a name with no assembly behind it, a
 * view it lacks, a view that leads back to itself, and a Lit assembly standing in a Lit view's
 * own tree, at any depth, with no shadow root between them.
 */
export function viewProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
  placeable: ReadonlyMap<string, PlacedAssembly>,
): readonly ProjectProblem[] {
  const problems: ProjectProblem[] = [];
  const byName = new Map(assemblies.map((assembly) => [assembly.name, assembly]));
  const names = [...byName.keys()];
  const rooted = new Map<string, boolean>();
  // Whether an assembly renders in a shadow root of its own, which hides what is inside it.
  const hasRoot = (assembly: DiscoveredAssembly): boolean => {
    const known = rooted.get(assembly.name);
    if (known !== undefined) return known;
    const file = isAbsolute(assembly.view) ? assembly.view : join(root, assembly.view);
    const own = readViewExport(root, file, "shadow") === true;
    rooted.set(assembly.name, own);
    return own;
  };

  for (const assembly of assemblies) {
    const from = { name: assembly.name, view: DEFAULT_VIEW };
    for (const problem of viewPlacementProblems(`"${assembly.name}"`, from, placeable)) {
      problems.push({
        path: assembly.view,
        rule:
          problem.about === "cycle"
            ? "an-assembly-is-never-its-own-ancestor"
            : "a-placement-names-an-assembly",
        message: problem.message,
        fix:
          problem.about === "cycle"
            ? "take one of the placements out, so that no assembly is placed inside itself"
            : problem.about === "view"
              ? 'place it without a view, or with "default", the one view an assembly in a project has'
              : `add it, or place one that exists: ${names.join(", ")}`,
      });
    }
    if (assembly.renderer !== "lit") continue;
    placedBeneath(
      from,
      (name) => placeable.get(name),
      (placed, hidden: boolean) => {
        const child = byName.get(placed.name);
        const own = child !== undefined && hasRoot(child);
        if (!hidden && !own && child?.renderer === "lit") {
          problems.push({
            path: assembly.view,
            rule: "lit-holds-lit-behind-a-shadow-root",
            message: `"${assembly.name}" is a Lit view with "${child.name}", a Lit assembly, in its own tree: Lit hydrates a view by reading every marker under it, and would read that assembly's as its own`,
            fix: `give "${child.name}" a shadow root of its own: export const shadow = true in ${child.view.split("/").slice(-1).join("")}`,
          });
        }
        return hidden || own;
      },
      false,
    );
  }
  return problems;
}
