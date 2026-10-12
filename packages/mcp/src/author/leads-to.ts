// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * How one assembly leads to another through what each view is known to place: the names from
 * the first to the second, each placing the next, or nothing where it does not lead there.
 *
 * Asked before a placement is written: placing a child inside a parent that the child already
 * leads to makes the parent its own ancestor, at whatever depth, which every render refuses.
 * The shortest way is answered, so the one who asked is shown the circle and not a walk.
 */
export function leadsTo(
  placements: ReadonlyMap<string, readonly { readonly name: string }[]>,
  from: string,
  to: string,
): readonly string[] | undefined {
  const cameFrom = new Map<string, string | undefined>([[from, undefined]]);
  const ahead = [from];
  for (let at = ahead.shift(); at !== undefined; at = ahead.shift()) {
    if (at === to) {
      const chain: string[] = [];
      for (let step: string | undefined = at; step !== undefined; step = cameFrom.get(step)) {
        chain.unshift(step);
      }
      return chain;
    }
    for (const { name } of placements.get(at) ?? []) {
      if (cameFrom.has(name)) continue;
      cameFrom.set(name, at);
      ahead.push(name);
    }
  }
  return undefined;
}
