// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "./literal-value.js";
import { readLiterals } from "./read-literals.js";

/**
 * The placements a page's declaration places from another server, by name, with the url each
 * names when it is written as a literal. Read from the source rather than run, so `check` stays
 * a reading of the project that executes none of it: a placement whose policy names a `url` is
 * remote, and one whose policy is computed is not seen here.
 */
export function remotePlacements(source: string): ReadonlyMap<string, string | undefined> {
  const found = new Map<string, string | undefined>();
  const visit = (value: LiteralValue): void => {
    if (value === null || typeof value === "string") return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    for (const [key, entry] of Object.entries(value as Record<string, LiteralValue>)) {
      if (entry !== null && typeof entry === "object" && !Array.isArray(entry) && "url" in entry) {
        const url = (entry as Record<string, LiteralValue>)["url"];
        found.set(key, typeof url === "string" ? url : undefined);
      }
      visit(entry);
    }
  };
  for (const literal of readLiterals(source)) visit(literal);
  return found;
}
