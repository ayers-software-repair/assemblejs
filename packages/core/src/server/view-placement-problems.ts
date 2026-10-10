// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PlacedAssembly } from "./placed-assembly.js";
import { placedBeneath } from "./placed-beneath.js";
import type { PlacementProblem } from "./placement-problem.js";

/**
 * Everything wrong with what one view's source is known to place, found without rendering it:
 * a name with no assembly behind it, a view the assembly does not have, and a placement that
 * leads back to the view itself, which every render refuses as its own ancestor. Boot calls
 * this with what the registry wrote and `check` with what it read from the files, so both
 * refuse the same view the same way.
 *
 * A placement whose view the source computes is held for its name alone, and is not followed
 * when looking for a way back: only a render knows where it leads.
 */
export function viewPlacementProblems(
  at: string,
  from: { readonly name: string; readonly view: string },
  assemblies: ReadonlyMap<string, PlacedAssembly>,
): readonly PlacementProblem[] {
  const problems = new Map<string, PlacementProblem>();
  const found = (name: string, about: PlacementProblem["about"], message: string): void => {
    problems.set(`${at} ${message}`, { name, about, message: `${at} ${message}` });
  };
  // What each view writes a view for, and nothing it computes one for.
  const written = (name: string): PlacedAssembly | undefined => {
    const assembly = assemblies.get(name);
    if (assembly?.placements === undefined) return assembly;
    return {
      ...assembly,
      placements: Object.fromEntries(
        Object.entries(assembly.placements).map(([view, placed]) => [
          view,
          placed.filter((one) => one.view !== undefined),
        ]),
      ),
    };
  };
  const isFrom = (placed: { readonly name: string; readonly view: string }): boolean =>
    placed.name === from.name && placed.view === from.view;

  for (const { name, view } of assemblies.get(from.name)?.placements?.[from.view] ?? []) {
    const assembly = assemblies.get(name);
    if (assembly === undefined) {
      found(name, "assembly", `places "${name}", and there is no such assembly`);
    } else if (view !== undefined && !assembly.views.includes(view)) {
      found(name, "view", `places "${name}" with a view "${view}" it does not have`);
    } else if (view !== undefined && isFrom({ name, view })) {
      found(name, "cycle", "places itself, and no render lets an assembly be its own ancestor");
    } else if (view !== undefined) {
      let returns = false;
      placedBeneath(
        { name, view },
        written,
        (placed) => {
          returns ||= isFrom(placed);
        },
        undefined,
      );
      if (returns) {
        found(
          name,
          "cycle",
          `places "${name}", whose own placements lead back to it, and no render lets an assembly be its own ancestor`,
        );
      }
    }
  }
  return [...problems.values()];
}
