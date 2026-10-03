// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "./literal-value.js";
import { readDefaultExport } from "./read-default-export.js";

/**
 * The placements a page's declaration places from another server, by name, with the url each
 * names when it is written as a literal: every entry of its `place` whose policy has a `url`.
 * Read from the source rather than run, so `check` stays a reading of the project that executes
 * none of it; a policy that is computed is not seen here.
 */
export function remotePlacements(source: string): ReadonlyMap<string, string | undefined> {
  const found = new Map<string, string | undefined>();
  const place = field(readDefaultExport(source), "place");
  if (place === null || typeof place !== "object" || Array.isArray(place)) return found;
  for (const [name, policy] of Object.entries(place as Record<string, LiteralValue>)) {
    if (policy === null || typeof policy !== "object" || Array.isArray(policy)) continue;
    if (!("url" in policy)) continue;
    const url = (policy as Record<string, LiteralValue>)["url"];
    found.set(name, typeof url === "string" ? url : undefined);
  }
  return found;
}

function field(value: LiteralValue, key: string): LiteralValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return (value as Record<string, LiteralValue>)[key] ?? null;
}
