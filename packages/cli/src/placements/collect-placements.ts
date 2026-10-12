// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ViewPlacement } from "@assemblejs/core";
import type { ViewPlacements } from "./view-placements.js";

/**
 * What a reader found, gathered into what a view places: each name and view once, in the order
 * first written, and apart from them every placement whose name is computed. An entry's name
 * or view is undefined where the source computes it; a view nobody wrote is the reader's to
 * give as the default.
 */
export function collectPlacements(
  found: readonly {
    readonly name: string | undefined;
    readonly view: string | undefined;
    /** The placement as the source writes it, near enough to find. */
    readonly shown: string;
  }[],
): ViewPlacements {
  const placements = new Map<string, ViewPlacement>();
  const unnamed: string[] = [];
  for (const { name, view, shown } of found) {
    if (name === undefined) unnamed.push(shown);
    else placements.set(`${name}/${view ?? ""}`, view === undefined ? { name } : { name, view });
  }
  return { placements: [...placements.values()], unnamed };
}
