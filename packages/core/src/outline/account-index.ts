// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { OutlineAccount } from "./outline-account.js";
import type { OutlinePlacement } from "./outline-placement.js";

/**
 * Every placement an account tells of, at any depth, by the id its envelope carries. An
 * envelope whose id is not here has no account of its own: it arrived inside an answer the
 * server kept, fetched from another server or was never asked for.
 */
export function accountIndex(
  account: OutlineAccount | undefined,
): ReadonlyMap<string, OutlinePlacement> {
  const index = new Map<string, OutlinePlacement>();
  const enter = (placements: readonly OutlinePlacement[]): void => {
    for (const placement of placements) {
      index.set(placement.id, placement);
      enter(placement.children ?? []);
    }
  };
  enter(account?.placements ?? []);
  return index;
}
