// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { renderEnvelope } from "../envelope/render-envelope.js";
import type { AssemblyRequest } from "./assembly-request.js";
import type { AssemblyResponse } from "./assembly-response.js";
import { DEFAULT_DEADLINE } from "./default-deadline.js";
import type { Diagnostic } from "./diagnostic.js";
import type { FailureReason } from "./failure-reason.js";
import { fallBack } from "./fall-back.js";
import type { Fetch } from "./fetch.js";
import { placementCache } from "./placement-cache.js";
import { refuseBeforeDispatch } from "./refuse-before-dispatch.js";
import type { SettleInput } from "./settle-input.js";
import type { SettledPlacement } from "./settled-placement.js";

/**
 * One placement's whole outcome. It never throws except for a placement declared required,
 * because a placement that throws is a page that dies from a child.
 *
 * A placement that declared a cache lifetime is answered from a fresh entry first. Otherwise what
 * was fetched, or on any failure the ladder `fallBack` climbs; every failure has an id even when
 * its transport reported none.
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

  // Not fetched now: an empty envelope marked deferred, with the id the browser fetches it by,
  // the page's parameters for it to send, and the fallback the page declared, inert, for the
  // browser to show should the fetch fail.
  if (plan?.defer === true) {
    const html = renderEnvelope({
      id,
      name,
      view,
      renderer: "",
      markup:
        plan.fallback === undefined ? "" : `<template data-fallback>${plan.fallback}</template>`,
      data: {},
      deferred: true,
      params: input.params,
    });
    return { html, diagnostic: at("deferred") };
  }

  // A placement refused before dispatch is never answered with content, cached or not: the
  // refusal is the point.
  const refusal = refuseBeforeDispatch(input);
  if (refusal !== undefined) {
    return fallBack(input, id, at("fallback", refusal, input.newId()), false);
  }

  // A placement that declared a lifetime is answered from its fresh entry without a request.
  const cache = placementCache(input);
  const cached = cache.read();
  if (cached !== undefined) return { html: cached, diagnostic: at("cache") };

  const deadline = plan?.deadline ?? DEFAULT_DEADLINE;
  const controller = new AbortController();
  const request: AssemblyRequest = {
    name,
    view,
    id,
    page: input.page,
    depth: input.depth + 1,
    // The ancestors' identities, innermost last: what the target checks itself against.
    path: input.path,
    query: input.query,
    params: input.params,
    headers: input.headers,
    count: input.count,
    // Its own deadline, and the request the composition belongs to: either one ends it.
    signal:
      input.signal === undefined
        ? controller.signal
        : AbortSignal.any([input.signal, controller.signal]),
  };

  const answer = await race(call(input.fetch, request), deadline, controller);

  // The cap holds whichever transport answered, so a local render is bounded like a remote one.
  if (answer.ok && new TextEncoder().encode(answer.html).length > input.limits.maxBytes) {
    const correlationId = input.newId();
    return fallBack(input, id, at("fallback", "too-large", correlationId), true);
  }
  if (answer.ok) {
    cache.write(answer.html, answer.version);
    const diagnostic = at(answer.source);
    // What the assembly composed inside itself hangs under it, so the account is a tree.
    return {
      html: answer.html,
      diagnostic:
        answer.nested === undefined ? diagnostic : { ...diagnostic, children: answer.nested },
    };
  }
  return fallBack(
    input,
    id,
    at("fallback", answer.reason, answer.correlationId || input.newId()),
    true,
  );
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
