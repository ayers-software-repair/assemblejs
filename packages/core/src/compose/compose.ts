// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ComposeOptions } from "./compose-options.js";
import type { ComposeResult } from "./compose-result.js";
import { DEFAULT_LIMITS } from "./default-limits.js";
import type { Diagnostic } from "./diagnostic.js";
import { findPlacements } from "./find-placements.js";
import { RequiredFailure } from "./required-failure.js";
import { settlePlacement } from "./settle-placement.js";

/**
 * A template and a way to reach assemblies in; html and an account of every placement out.
 *
 * No HTTP, no framework, no filesystem, no clock of its own. The server is a thin wrapper that
 * supplies a real fetch, so every rule below is provable before a server exists.
 *
 * Placements settle independently and concurrently: the page is ready when the slowest of them
 * finishes or times out, never later, and never fails because one of them did. The one
 * exception is a placement declared required, which is the only way a page dies from a child.
 */
export async function compose(options: ComposeOptions): Promise<ComposeResult> {
  const limits = options.limits ?? DEFAULT_LIMITS;
  const placements = findPlacements(options.template);
  const query = options.query ?? new URLSearchParams();
  const headers = options.headers ?? {};

  for (const placement of placements) {
    const plan = options.plan[placement.name];
    if (plan?.defer === true && plan.required === true) {
      throw new Error(
        `assembly "${placement.name}" is declared both deferred and required. A deferred ` +
          `assembly is fetched after the page has shipped, so its failure cannot fail the page.`,
      );
    }
  }

  // allSettled, not all: one rejection must not discard the placements that answered. A
  // required placement's failure is re-thrown afterwards, once every sibling has settled, so a
  // page that dies still dies with a complete account of why.
  const settled = await Promise.allSettled(
    placements.map((placement) =>
      settlePlacement({
        name: placement.name,
        view: placement.view,
        plan: options.plan[placement.name],
        fetch: options.fetch,
        cache: options.cache,
        limits,
        page: options.page,
        depth: options.depth ?? 0,
        path: options.path ?? [],
        query,
        headers,
        newId: options.newId,
        now: options.now,
      }),
    ),
  );

  const required = settled.find(
    (outcome) => outcome.status === "rejected" && outcome.reason instanceof RequiredFailure,
  );
  if (required !== undefined && required.status === "rejected") {
    throw required.reason as RequiredFailure;
  }
  // Anything else that rejected is a defect in settling, not a reason to lose the page. It
  // becomes that placement's failure and the rest of the page is served, because discarding
  // what allSettled just bought is how one bad child takes a page down again.

  const diagnostics: Diagnostic[] = [];
  let html = "";
  let cursor = 0;
  placements.forEach((placement, index) => {
    const outcome = settled[index];
    if (outcome === undefined) return;
    html += options.template.slice(cursor, placement.start);
    cursor = placement.end;
    if (outcome.status === "fulfilled") {
      html += outcome.value.html;
      diagnostics.push(outcome.value.diagnostic);
      return;
    }
    // The placement renders as nothing, and says so, rather than vanishing without a trace.
    diagnostics.push({
      name: placement.name,
      view: placement.view,
      id: "",
      source: "fallback",
      reason: "invalid",
      ms: 0,
    });
  });
  html += options.template.slice(cursor);

  // The output is in the template's order whichever placement finished first.
  return { html, diagnostics };
}
