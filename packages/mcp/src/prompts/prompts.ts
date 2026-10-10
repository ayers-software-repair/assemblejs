// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ADD_ASSEMBLY_PROMPT } from "./add-assembly-prompt.js";
import type { AgentPrompt } from "./agent-prompt.js";
import { FIX_FINDINGS_PROMPT } from "./fix-findings-prompt.js";
import { MAKE_PAGE_PROMPT } from "./make-page-prompt.js";
import { PLACE_ASSEMBLY_PROMPT } from "./place-assembly-prompt.js";

/**
 * What a person asks an agent for most, in the order a project grows: an assembly, its place,
 * a page, and what `check` found. Each is briefed as the framework would brief it, so the
 * agent's first attempt is the framework's way and not a guess at it.
 */
export const PROMPTS: readonly AgentPrompt[] = [
  ADD_ASSEMBLY_PROMPT,
  PLACE_ASSEMBLY_PROMPT,
  MAKE_PAGE_PROMPT,
  FIX_FINDINGS_PROMPT,
];
