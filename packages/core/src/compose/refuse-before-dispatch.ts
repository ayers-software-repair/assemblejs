// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FailureReason } from "./failure-reason.js";
import { identity } from "./identity.js";
import type { SettleInput } from "./settle-input.js";

/**
 * Why a parent refuses a placement itself, before anything is dispatched, or undefined when it
 * dispatches: one more level would pass the depth cap, the target is already among its own
 * ancestors, the request has already placed as many as one request may, or the request the
 * composition belongs to has already been aborted. Refused here, a placement never reaches a
 * transport, so a cycle costs nothing and cannot recurse, a request asked to place without end
 * renders no more than its limit, and a composition nobody is waiting for starts no further
 * work.
 *
 * What the design refuses comes first, so for depth and a cycle the reason a placement is given
 * never depends on timing. How many came before it is told in the order templates were
 * composed: the order written within one, and the order they finished rendering across those
 * composed at once. So past the limit, which placements are refused may differ between two
 * runs of one request, and how many are placed never does.
 */
export function refuseBeforeDispatch(
  input: Pick<SettleInput, "name" | "view" | "depth" | "path" | "ordinal" | "limits" | "signal">,
): FailureReason | undefined {
  if (input.depth + 1 > input.limits.depth) return "depth";
  if (input.path.includes(identity(input.name, input.view))) return "cycle";
  if (input.ordinal > input.limits.placements) return "too-many";
  if (input.signal?.aborted === true) return "timeout";
  return undefined;
}
