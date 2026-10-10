// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FailureReason } from "./failure-reason.js";
import { identity } from "./identity.js";
import type { SettleInput } from "./settle-input.js";

/**
 * Why a parent refuses a placement itself, before anything is dispatched, or undefined when it
 * dispatches: one more level would pass the depth cap, or the target is already among its own
 * ancestors. Refused here, a placement never reaches a transport, so a cycle costs nothing and
 * cannot recurse.
 */
export function refuseBeforeDispatch(
  input: Pick<SettleInput, "name" | "view" | "depth" | "path" | "limits">,
): FailureReason | undefined {
  if (input.depth + 1 > input.limits.depth) return "depth";
  if (input.path.includes(identity(input.name, input.view))) return "cycle";
  return undefined;
}
