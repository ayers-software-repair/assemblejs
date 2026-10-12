// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { OutlineRect } from "./outline-rect.js";

/**
 * Where each chip goes so that none covers another: each where it was wanted, or as far below
 * that as clears every chip placed before it. An assembly and the first thing it places begin
 * at one corner, so their chips would otherwise stand on each other; taken in document order,
 * a parent keeps the corner and what it holds steps down. An entry that wants no place gets
 * none.
 */
export function placeChips(
  wanted: readonly (OutlineRect | undefined)[],
): (OutlineRect | undefined)[] {
  const placed: OutlineRect[] = [];
  return wanted.map((chip) => {
    if (chip === undefined) return undefined;
    let top = chip.top;
    // Each pass moves below one chip already placed, so the passes are at most that many.
    for (let pass = 0; pass <= placed.length; pass++) {
      const under = placed.find(
        (other) =>
          chip.left < other.left + other.width &&
          other.left < chip.left + chip.width &&
          top < other.top + other.height &&
          other.top < top + chip.height,
      );
      if (under === undefined) break;
      top = under.top + under.height;
    }
    const at = { ...chip, top };
    placed.push(at);
    return at;
  });
}
