// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CachedContent } from "../compose/cached-content.js";
import type { ContentCache } from "../compose/content-cache.js";

/**
 * The cache a server holds placements in when their page declares a lifetime: in memory, each
 * entry gone once its lifetime passes, and the oldest dropped once it holds `capacity` of them,
 * so a page whose query varies without bound cannot grow it without bound.
 */
export function createMemoryCache(capacity = 1000, now: () => number = Date.now): ContentCache {
  const entries = new Map<string, { readonly content: CachedContent; readonly until: number }>();
  return {
    get: (key) => {
      const held = entries.get(key);
      if (held === undefined) return undefined;
      if (held.until <= now()) {
        entries.delete(key);
        return undefined;
      }
      return held.content;
    },
    set: (key, value, ttl) => {
      entries.delete(key);
      entries.set(key, { content: value, until: now() + ttl });
      while (entries.size > capacity) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
    },
  };
}
