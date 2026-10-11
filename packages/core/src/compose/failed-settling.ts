// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { renderEnvelope } from "../envelope/render-envelope.js";
import type { AssemblyPlan } from "./assembly-plan.js";
import type { Diagnostic } from "./diagnostic.js";
import type { Placement } from "./placement.js";
import { RequiredFailure } from "./required-failure.js";
import type { SettledPlacement } from "./settled-placement.js";

/**
 * What a placement shows when settling it threw, which settling never does on purpose: a defect
 * in the composer or in a cache the server was given, not a failure of the assembly's. It is
 * shown as DESIGN 3.3 shows any failure, the declared fallback or an empty envelope marked
 * failed, under one id for the envelope, the diagnostic and the line the server logs, with
 * what was thrown kept in the diagnostic for that line. The cache is not read: whatever threw
 * may have been it. A placement declared required fails its page, as it does for any failure.
 */
export function failedSettling(
  placement: Pick<Placement, "name" | "view">,
  plan: AssemblyPlan | undefined,
  id: string,
  cause: unknown,
): SettledPlacement {
  const diagnostic: Diagnostic = {
    name: placement.name,
    view: placement.view,
    id,
    source: "fallback",
    reason: "invalid",
    correlationId: id,
    cause: cause instanceof Error ? cause.message : String(cause),
    ms: 0,
  };
  if (plan?.required === true) throw new RequiredFailure(diagnostic);
  const html = renderEnvelope({
    id,
    name: placement.name,
    view: placement.view,
    renderer: "",
    markup: plan?.fallback ?? "",
    data: {},
    failed: id,
  });
  return { html, diagnostic };
}
