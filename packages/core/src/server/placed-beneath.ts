// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { identity } from "../compose/identity.js";
import type { PlacedAssembly } from "./placed-assembly.js";

/**
 * Walks everything a view's source is known to lead to: what it places, then what each of
 * those views places, depth first, each name and view once, so a view that leads back to
 * itself ends the walk where it would repeat.
 *
 * A placement whose view the source computes stands for every view its assembly has, as any
 * of them may be the one rendered. A name no assembly answers to is passed over; the placement
 * rules report it. What `visit` answers for one is handed to the visits beneath it.
 */
export function placedBeneath<State>(
  from: { readonly name: string; readonly view: string },
  assemblyOf: (name: string) => PlacedAssembly | undefined,
  visit: (placed: { readonly name: string; readonly view: string }, above: State) => State,
  state: State,
): void {
  const seen = new Set([identity(from.name, from.view)]);
  const descend = (name: string, view: string, above: State): void => {
    for (const placement of assemblyOf(name)?.placements?.[view] ?? []) {
      const child = assemblyOf(placement.name);
      if (child === undefined) continue;
      for (const childView of placement.view === undefined ? child.views : [placement.view]) {
        const key = identity(placement.name, childView);
        if (seen.has(key)) continue;
        seen.add(key);
        const placed = { name: placement.name, view: childView };
        descend(placed.name, placed.view, visit(placed, above));
      }
    }
  };
  descend(from.name, from.view, state);
}
