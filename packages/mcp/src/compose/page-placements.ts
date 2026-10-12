// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PagePolicy } from "@assemblejs/check";
import type { PagePlacement } from "@assemblejs/core";

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The placements a page's declaration writes, as the server would take them, from what `check`
 * read of it: each field kept when it is written as the server's type, left out when it is
 * computed or written as something else. A placement from another server, by a url written or
 * computed, is composed deferred here and its url dropped: the agent surface reaches no network
 * (DESIGN 13.2), and a deferred envelope is what the browser fills on a served page.
 */
export function pagePlacements(policy: PagePolicy): Readonly<Record<string, PagePlacement>> {
  const placements: Record<string, PagePlacement> = {};
  for (const [name, written] of Object.entries(policy.place)) {
    if (!isObject(written)) continue;
    const { deadline, fallback, required, defer, cache } = written;
    const ttl = isObject(cache) ? cache["ttl"] : undefined;
    placements[name] = {
      ...(typeof deadline === "number" ? { deadline } : {}),
      ...(typeof fallback === "string" ? { fallback } : {}),
      ...(typeof required === "boolean" ? { required } : {}),
      ...(typeof defer === "boolean" ? { defer } : {}),
      ...(typeof ttl === "number" ? { cache: { ttl } } : {}),
      ...(policy.remote.has(name) ? { defer: true } : {}),
    };
  }
  return placements;
}
