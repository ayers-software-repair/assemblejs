// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { cacheKey } from "./cache-key.js";
import { carriesCredential } from "./carries-credential.js";
import type { SettleInput } from "./settle-input.js";

/**
 * One placement's view of the server's cache. The server holds one cache for every page, so only
 * a placement that declared a lifetime reads or writes it: one that declared none is never
 * answered with what another page cached. Never for a request carrying a credential, whose
 * answer belongs to one visitor.
 */
export function placementCache(input: SettleInput): {
  read(): string | undefined;
  write(html: string, version: string | undefined): void;
} {
  const ttl = input.plan?.cache?.ttl ?? 0;
  const cache = ttl > 0 && !carriesCredential(input.headers) ? input.cache : undefined;
  const key = cacheKey(input.name, input.view, input.query, input.plan?.url, input.headers);
  return {
    read: () => cache?.get(key)?.html,
    write: (html, version) =>
      cache?.set(key, version === undefined ? { html } : { html, version }, ttl),
  };
}
