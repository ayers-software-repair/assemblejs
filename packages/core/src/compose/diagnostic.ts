// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FailureReason } from "./failure-reason.js";

/**
 * What answered, for one placement, and why. One per placement, but for the placements a
 * request refused for passing its limit, which share one that says how many.
 */
export interface Diagnostic {
  readonly name: string;
  readonly view: string;
  readonly id: string;
  /**
   * Which rung answered. `deferred` is not a rung: it means the placement was never reached
   * during this render because the browser fills it after load.
   */
  readonly source: "local" | "remote" | "cache" | "fallback" | "deferred";
  readonly reason?: FailureReason;
  readonly correlationId?: string;
  readonly ms: number;
  /**
   * How many placements this one accounts for, on the account of every placement a request
   * refused for passing its limit: they share one id, one line in the log and this.
   */
  readonly refused?: number;
  /**
   * How each placement the answering assembly's own view made was answered, so a page's account
   * is a tree. Absent when it placed nothing, and for an assembly another server answered: that
   * server's account of its children is in its own log.
   */
  readonly children?: readonly Diagnostic[];
}
