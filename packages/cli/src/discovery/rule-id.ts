// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { RULE_IDS } from "./rule-ids.js";

/** The id of a rule a project problem can name. */
export type RuleId = (typeof RULE_IDS)[number];
