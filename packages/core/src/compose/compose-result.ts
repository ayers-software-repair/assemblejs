// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "./diagnostic.js";

/** What composing produced, and an account of how every placement was answered. */
export interface ComposeResult {
  readonly html: string;
  /** One per placement, always, whichever rung of the ladder answered. */
  readonly diagnostics: readonly Diagnostic[];
}
