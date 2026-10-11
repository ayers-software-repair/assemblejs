// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Admission } from "./admission.js";
import type { SettleInput } from "./settle-input.js";

/**
 * Whether the visitor a placement's request belongs to may be shown it. Everyone may where
 * nothing is there to ask. An assembly the plan sends to another server is not asked about:
 * that server decides for itself, of the request it is sent. And where what is asked throws,
 * the answer is no: a broken gate is a closed one.
 */
export async function admitted(
  input: Pick<SettleInput, "name" | "view" | "plan" | "admit">,
): Promise<Admission> {
  if (input.admit === undefined || input.plan?.url !== undefined) return { admitted: true };
  try {
    return await input.admit(input.name, input.view);
  } catch {
    return { admitted: false };
  }
}
