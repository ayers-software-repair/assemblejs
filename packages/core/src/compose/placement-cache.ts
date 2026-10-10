// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { cacheKey } from "./cache-key.js";
import { carriesCredential } from "./carries-credential.js";
import { holdsFailedEnvelope } from "./holds-failed-envelope.js";
import type { SettleInput } from "./settle-input.js";

/**
 * One placement's view of the server's cache. The server holds one cache for every page, so only
 * a placement that declared a lifetime reads or writes it: one that declared none is never
 * answered with what another page cached. Never for a request carrying a credential, whose
 * answer belongs to one visitor. And never an answer holding a failed envelope: a failure is
 * not content, and one cached inside a good parent would be served for the whole lifetime, long
 * after the child inside it had recovered.
 */
export function placementCache(input: SettleInput): {
  read(): string | undefined;
  write(html: string, version: string | undefined): void;
} {
  const ttl = input.plan?.cache?.ttl ?? 0;
  const cache = ttl > 0 && !carriesCredential(input.headers) ? input.cache : undefined;
  // Keyed by its lifetime too, so a page that declared a shorter one is never answered with what a
  // page with a longer one cached.
  const key = `${ttl}|${cacheKey(input.name, input.view, input.query, input.plan?.url, input.headers, input.params)}`;
  return {
    read: () => cache?.get(key)?.html,
    write: (html, version) => {
      if (holdsFailedEnvelope(html)) return;
      cache?.set(key, version === undefined ? { html } : { html, version }, ttl);
    },
  };
}
