// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { identity } from "./identity.js";

/**
 * Where a placement's content is held. The query is part of it: a different query is a different
 * page. A placement from another server is keyed by its url, never by the name the template gave
 * it, because two pages may place two different remote assemblies under one local name, and a
 * shared key would serve one page the other's.
 */
export function cacheKey(name: string, view: string, query: URLSearchParams, url?: string): string {
  const sorted = [...query.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const search = new URLSearchParams(sorted).toString();
  const where = url ?? identity(name, view);
  return search.length > 0 ? `${where}?${search}` : where;
}
