// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PlacementCount } from "./placement-count.js";
import type { RefusedReason } from "./refused-reason.js";

/**
 * The count of one request's placements, begun at nothing by whatever composes the request's
 * first template.
 *
 * Every placement refused for one reason shares one id, minted when the first is, and one
 * account, which says how many and names the first. A value that names ten thousand assemblies
 * is then ten thousand empty envelopes under one id, and one line in the log; so is everything
 * a request stopped placing once its asker had left.
 */
export function countPlacements(newId: () => string): PlacementCount {
  let placed = 0;
  const refusals = new Map<
    RefusedReason,
    { readonly name: string; readonly view: string; readonly id: string; refused: number }
  >();
  return {
    next: () => (placed += 1),
    refuse: (reason, name, view) => {
      const first = refusals.get(reason) ?? { name, view, id: newId(), refused: 0 };
      first.refused += 1;
      refusals.set(reason, first);
      return first.id;
    },
    account: () =>
      [...refusals.entries()].map(([reason, first]) => ({
        name: first.name,
        view: first.view,
        id: "",
        source: "fallback",
        reason,
        correlationId: first.id,
        ms: 0,
        refused: first.refused,
      })),
  };
}
