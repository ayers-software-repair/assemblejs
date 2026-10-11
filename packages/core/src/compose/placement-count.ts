// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "./diagnostic.js";
import type { RefusedReason } from "./refused-reason.js";

/**
 * The count of one request's placements: what numbers each as it is composed, and what keeps
 * the one account, by reason, of those refused in a way the request accounts for once. It is handed on to
 * whatever a placement composes in this process, so the count is the request's and not one
 * template's, and it is never sent to another server, whose own request has its own.
 */
export interface PlacementCount {
  /** The next placement's number, the first being one. */
  next(): number;
  /**
   * Told of one placement refused, and why. Answers the id every placement of the request
   * refused for that reason carries, so one log line finds them all.
   */
  refuse(reason: RefusedReason, name: string, view: string): string;
  /** One account for each reason any placement was refused for, in the order first met. */
  account(): readonly Diagnostic[];
}
