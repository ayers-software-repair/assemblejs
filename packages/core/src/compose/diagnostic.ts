// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FailureReason } from "./failure-reason.js";

/** What answered, for one placement, and why. One per placement, always. */
export interface Diagnostic {
  readonly name: string;
  readonly id: string;
  /** Which rung of the fallback ladder answered. */
  readonly source: "local" | "remote" | "cache" | "fallback";
  readonly reason?: FailureReason;
  readonly correlationId?: string;
  readonly ms: number;
}
