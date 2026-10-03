// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ProjectProblem } from "@assemblejs/cli";

/**
 * What a tool answers with.
 *
 * A structure, never prose. An agent that has to parse a sentence written for a person is an
 * agent guessing, and this whole surface exists so it does not have to.
 */
export interface ToolResult {
  readonly ok: boolean;
  /** Everything the call produced, shaped for the tool that produced it. */
  readonly result: unknown;
  /**
   * What went wrong, phrased so the agent can act rather than retry blindly: a structure with the
   * rule and the fix wherever the tool knows them.
   */
  readonly problems: readonly (ProjectProblem | string)[];
  /** What is worth doing next. An assembly nobody placed is the commonest half-finished state. */
  readonly next?: readonly string[];
}
