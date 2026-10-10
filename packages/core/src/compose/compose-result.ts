// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "./diagnostic.js";

/** What composing produced, and an account of how every placement was answered. */
export interface ComposeResult {
  readonly html: string;
  /**
   * One per placement, whichever rung of the ladder answered, but for the placements the
   * request refused for passing its limit: those share one, which says how many, and it is
   * given by the composition that began the request's count.
   */
  readonly diagnostics: readonly Diagnostic[];
}
