// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const REMOTE = /(["']?)([a-z][a-z0-9-]*)\1\s*:\s*\{[^{}]*?\burl\s*:\s*(?:(["'`])([^"'`]*)\3)?/g;

/**
 * The placements a page's declaration places from another server, by name, with the url each
 * names when it is written as a literal. Read from the source rather than run, so `check` stays
 * a reading of the project that executes none of it: a placement whose policy names a `url` is
 * remote, and one built some other way is not seen here.
 */
export function remotePlacements(source: string): ReadonlyMap<string, string | undefined> {
  const found = new Map<string, string | undefined>();
  for (const match of source.matchAll(REMOTE)) {
    found.set(match[2] ?? "", match[4]);
  }
  return found;
}
