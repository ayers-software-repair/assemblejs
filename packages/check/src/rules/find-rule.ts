// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Rule } from "./rule.js";
import { RULES } from "./rules.js";

/** One rule by its id, for an agent that wants to know why before it decides. */
export function findRule(id: string): Rule | undefined {
  return RULES.find((rule) => rule.id === id);
}
