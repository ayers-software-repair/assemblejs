// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED } from "../shape/computed.js";
import type { LiteralValue } from "./literal-value.js";
import type { PagePolicy } from "./page-policy.js";
import { readDefaultExport } from "./read-default-export.js";

const isObject = (value: LiteralValue): value is { readonly [key: string]: LiteralValue } =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * What a page's declaration says about its placements and its stream, read from the source and
 * never run, as far as it is written as literals, so `check` holds it to the rules boot holds it
 * to. What is computed is left out, because a value `check` cannot read is not reported either
 * way: a computed policy is no policy, a computed deadline or flag is absent from its policy. A
 * computed url is the one exception, kept as a mark that the placement is another server's,
 * which is all the rules read of it; where it is written, it is read for the url rules too.
 * What is written is kept as written, a null or an array included, for the rules to refuse.
 * Throws for a module that cannot be compiled or parsed.
 */
export function readPagePolicy(source: string): PagePolicy {
  const declared = readDefaultExport(source);
  const fields = isObject(declared) ? declared : {};
  const stream = fields["stream"];
  const place: Record<string, unknown> = {};
  const remote = new Map<string, string | undefined>();
  const raw = fields["place"];
  const entries = isObject(raw) || Array.isArray(raw) ? Object.entries(raw) : [];
  for (const [name, policy] of entries) {
    if (policy === undefined) continue;
    if (!isObject(policy)) {
      place[name] = policy;
      continue;
    }
    const read: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(policy)) {
      if (value !== undefined) read[key] = value;
      else if (key === "url") read[key] = COMPUTED;
    }
    if ("url" in policy) {
      const url = policy["url"];
      remote.set(name, typeof url === "string" ? url : undefined);
    }
    place[name] = read;
  }
  return { place, remote, stream: typeof stream === "string" ? stream : undefined };
}
