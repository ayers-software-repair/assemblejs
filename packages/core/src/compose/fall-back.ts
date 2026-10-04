// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { renderEnvelope } from "../envelope/render-envelope.js";
import type { Diagnostic } from "./diagnostic.js";
import { placementCache } from "./placement-cache.js";
import { RequiredFailure } from "./required-failure.js";
import type { SettleInput } from "./settle-input.js";
import type { SettledPlacement } from "./settled-placement.js";

/**
 * What a placement shows once it has failed, the rungs of DESIGN 3.3 in order: its declared
 * fallback, then the last good content the cache holds, then an empty envelope. A fallback and
 * the empty envelope are marked failed with the failure's correlation id, so the one failing
 * placement on a page can be found in the log from the page itself.
 *
 * A required placement whose last good content is still held has not failed, as the ladder
 * answered it; otherwise it fails the page. `cached` says whether the cache may answer at all,
 * which a placement refused before dispatch may not: the refusal is the point.
 */
export function fallBack(
  input: SettleInput,
  id: string,
  diagnostic: Diagnostic,
  cached: boolean,
): SettledPlacement {
  const last = cached ? placementCache(input).read() : undefined;
  const held =
    last === undefined
      ? undefined
      : { html: last, diagnostic: { ...diagnostic, source: "cache" as const } };
  if (input.plan?.required === true) {
    if (held !== undefined) return held;
    throw new RequiredFailure(diagnostic);
  }
  if (input.plan?.fallback === undefined && held !== undefined) return held;
  const html = renderEnvelope({
    id,
    name: input.name,
    view: input.view,
    renderer: "",
    markup: input.plan?.fallback ?? "",
    data: {},
    failed: diagnostic.correlationId ?? "",
  });
  return { html, diagnostic };
}
