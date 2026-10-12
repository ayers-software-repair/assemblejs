// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { cacheKey } from "./cache-key.js";
import { carriesCredential } from "./carries-credential.js";
import type { Diagnostic } from "./diagnostic.js";
import { heldAssemblies } from "./held-assemblies.js";
import { holdsFailedEnvelope } from "./holds-failed-envelope.js";
import { reissueIds } from "./reissue-ids.js";
import type { SettleInput } from "./settle-input.js";

/**
 * One placement's view of the server's cache. The server holds one cache for every page, so only
 * a placement that declared a lifetime reads or writes it: one that declared none is never
 * answered with what another page cached. Never for a request carrying a credential, whose
 * answer belongs to one visitor. And never an answer holding a failed envelope: a failure is
 * not content, and one cached inside a good parent would be served for the whole lifetime, long
 * after the child inside it had recovered.
 *
 * An answer holds what its assembly's view placed, composed for the visitor who filled the
 * cache. So it is written with the assemblies it holds, and read for a visitor only when each
 * of them would be shown to that visitor: a guarded assembly is guarded inside a cached answer
 * as it is anywhere. Where asking throws, or what an answer holds was never recorded, it is no
 * answer; where no control is on, nothing is asked.
 *
 * An answer is kept with the ids its first composition minted, and is read as the placement's
 * own that asks: its envelope with the id that placement was given, and each inside it a new one.
 */
export function placementCache(input: SettleInput): {
  read(id: string): Promise<string | undefined>;
  write(html: string, version: string | undefined, nested?: readonly Diagnostic[]): void;
} {
  const ttl = input.plan?.cache?.ttl ?? 0;
  const cache = ttl > 0 && !carriesCredential(input.headers) ? input.cache : undefined;
  // Keyed by its lifetime too, so a page that declared a shorter one is never answered with what a
  // page with a longer one cached.
  const key = `${ttl}|${cacheKey(input.name, input.view, input.query, input.plan?.url, input.headers, input.params)}`;
  return {
    read: async (id) => {
      const held = cache?.get(key);
      if (held === undefined) return undefined;
      if (input.admit !== undefined) {
        if (held.holds === undefined) return undefined;
        try {
          for (const { name, view } of held.holds) {
            if (!(await input.admit(name, view)).admitted) return undefined;
          }
        } catch {
          return undefined;
        }
      }
      return reissueIds(held.html, id, input.newId);
    },
    write: (html, version, nested) => {
      if (holdsFailedEnvelope(html)) return;
      cache?.set(
        key,
        { html, ...(version === undefined ? {} : { version }), holds: heldAssemblies(nested) },
        ttl,
      );
    },
  };
}
