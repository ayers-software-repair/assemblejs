// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "./diagnostic.js";

/**
 * The count of one request's placements: what numbers each as it is composed, and what keeps
 * the one account of those refused for passing the request's limit. It is handed on to
 * whatever a placement composes in this process, so the count is the request's and not one
 * template's, and it is never sent to another server, whose own request has its own.
 */
export interface PlacementCount {
  /** The next placement's number, the first being one. */
  next(): number;
  /**
   * Told of one placement refused for passing the limit. Answers the id every such placement
   * of the request carries, so one log line finds them all.
   */
  refuse(name: string, view: string): string;
  /** The one account of every placement refused so, or undefined when none was. */
  account(): Diagnostic | undefined;
}
