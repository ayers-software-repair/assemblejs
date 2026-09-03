// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyRequest } from "./assembly-request.js";
import type { AssemblyResponse } from "./assembly-response.js";
import { cacheKey } from "./cache-key.js";
import { carriesCredential } from "./carries-credential.js";
import { DEFAULT_DEADLINE } from "./default-deadline.js";
import type { Diagnostic } from "./diagnostic.js";
import type { FailureReason } from "./failure-reason.js";
import type { Fetch } from "./fetch.js";
import { identity } from "./identity.js";
import { RequiredFailure } from "./required-failure.js";
import type { SettleInput } from "./settle-input.js";
import type { SettledPlacement } from "./settled-placement.js";

/**
 * One placement's whole outcome. It never throws except for a placement declared required,
 * because a placement that throws is a page that dies from a child.
 *
 * The ladder, in order: the content that was fetched, then the last good content the cache
 * holds, then the declared fallback, then nothing. The cache outranks the fallback because it
 * holds real content this assembly actually produced, and the fallback is what to show when
 * there is none.
 */
export async function settlePlacement(input: SettleInput): Promise<SettledPlacement> {
  const { name, view, plan, now } = input;
  const id = input.newId();
  const started = now();
  const at = (
    source: Diagnostic["source"],
    reason?: FailureReason,
    correlationId?: string,
  ): Diagnostic => ({
    name,
    view,
    id,
    source,
    ...(reason === undefined ? {} : { reason }),
    ...(correlationId === undefined ? {} : { correlationId }),
    ms: now() - started,
  });

  if (plan?.defer === true) {
    return { html: "", diagnostic: at("deferred") };
  }

  const refusal = refuseBeforeDispatch(input);
  if (refusal !== undefined) {
    return fallBack(input, at("fallback", refusal), refusal);
  }

  const deadline = plan?.deadline ?? DEFAULT_DEADLINE;
  const controller = new AbortController();
  const request: AssemblyRequest = {
    name,
    view,
    id,
    page: input.page,
    depth: input.depth + 1,
    path: [...input.path, identity(name, view)],
    query: input.query,
    headers: input.headers,
    signal: controller.signal,
  };

  const answer = await race(call(input.fetch, request), deadline, controller);

  if (answer.ok) {
    write(input, answer.html, answer.version);
    return { html: answer.html, diagnostic: at(answer.source) };
  }
  return fallBack(input, at("fallback", answer.reason, answer.correlationId), answer.reason);
}

/** The two refusals a parent makes itself, before anything is dispatched. */
function refuseBeforeDispatch(input: SettleInput): FailureReason | undefined {
  if (input.depth + 1 > input.limits.depth) return "depth";
  if (input.path.includes(identity(input.name, input.view))) return "cycle";
  return undefined;
}

/**
 * Calls the transport in a way that cannot take the page down.
 *
 * The declared type says a Fetch returns a Promise of a result, but a type is a promise about
 * source, not about what a caller actually hands over. A transport can throw before it returns,
 * return something that is not a Promise at all, or resolve to nothing. Each of those defeated
 * an earlier version here: the page died on a placement that was never declared required, which
 * is the exact failure isolation exists to prevent.
 */
async function call(fetch: Fetch, request: AssemblyRequest): Promise<AssemblyResponse> {
  let answered: unknown;
  try {
    answered = await fetch(request);
  } catch (error) {
    return {
      ok: false,
      reason: "transport",
      detail: error instanceof Error ? error.message : String(error),
      correlationId: "",
    };
  }
  if (typeof answered !== "object" || answered === null || !("ok" in answered)) {
    return {
      ok: false,
      reason: "invalid",
      detail: `the transport answered ${answered === undefined ? "nothing" : typeof answered}`,
      correlationId: "",
    };
  }
  return answered as AssemblyResponse;
}

/**
 * A deadline that is enforced whether or not the transport honours it. The signal asks the
 * transport to stop, and the race guarantees the caller is answered either way: a fetch that
 * ignores its signal would otherwise hold the page open for as long as it liked.
 */
async function race(
  answering: Promise<AssemblyResponse>,
  deadline: number,
  controller: AbortController,
): Promise<AssemblyResponse> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<AssemblyResponse>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({
        ok: false,
        reason: "timeout",
        detail: `deadline of ${deadline}ms elapsed`,
        correlationId: "",
      });
    }, deadline);
  });
  try {
    return await Promise.race([answering, expired]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function write(input: SettleInput, html: string, version: string | undefined): void {
  const ttl = input.plan?.cache?.ttl ?? 0;
  if (ttl <= 0 || input.cache === undefined) return;
  if (carriesCredential(input.headers)) return;
  input.cache.set(
    cacheKey(input.name, input.view, input.query),
    version === undefined ? { html } : { html, version },
    ttl,
  );
}

function fallBack(
  input: SettleInput,
  diagnostic: Diagnostic,
  reason: FailureReason,
): SettledPlacement {
  // The cache is consulted BEFORE required is considered. A required placement whose last good
  // content is still held has not failed: the ladder answered it. Throwing first killed pages
  // over an outage the cache was there to absorb.
  if (input.cache !== undefined && !carriesCredential(input.headers)) {
    const held = input.cache.get(cacheKey(input.name, input.view, input.query));
    if (held !== undefined) {
      return { html: held.html, diagnostic: { ...diagnostic, source: "cache", reason } };
    }
  }
  if (input.plan?.required === true) throw new RequiredFailure(diagnostic);
  return { html: input.plan?.fallback ?? "", diagnostic };
}
