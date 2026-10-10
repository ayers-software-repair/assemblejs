// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PlacementCount } from "./placement-count.js";

/**
 * The count of one request's placements, begun at nothing by whatever composes the request's
 * first template.
 *
 * Every placement refused for passing the limit shares one id, minted when the first is, and
 * one account, which says how many and names the first. A value that names ten thousand
 * assemblies is then ten thousand empty envelopes under one id, and one line in the log.
 */
export function countPlacements(newId: () => string): PlacementCount {
  let placed = 0;
  let refused = 0;
  let first: { readonly name: string; readonly view: string; readonly id: string } | undefined;
  return {
    next: () => (placed += 1),
    refuse: (name, view) => {
      refused += 1;
      first ??= { name, view, id: newId() };
      return first.id;
    },
    account: () =>
      first === undefined
        ? undefined
        : {
            name: first.name,
            view: first.view,
            id: "",
            source: "fallback",
            reason: "too-many",
            correlationId: first.id,
            ms: 0,
            refused,
          },
  };
}
