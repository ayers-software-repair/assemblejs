// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { identity } from "./identity.js";

/** Where a placement's last-good content is held. The query is part of it: a different query is a different page. */
export function cacheKey(name: string, view: string, query: URLSearchParams): string {
  const sorted = [...query.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const search = new URLSearchParams(sorted).toString();
  return search.length > 0 ? `${identity(name, view)}?${search}` : identity(name, view);
}
