// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "../compose/diagnostic.js";

/**
 * How one placement was answered, as the server that composed a page tells the page's outline:
 * which assembly, by which rung of the ladder, and how long the server waited for it.
 *
 * It is a chosen few of the composer's own account and never the whole of it. The page is sent
 * to a visitor, and what a failure threw is for the log alone.
 */
export type OutlinePlacement = {
  /** The id on the envelope this is the account of. */
  readonly id: string;
  readonly name: string;
  readonly view: string;
  /** Which rung answered; `deferred` means the browser asks for it after the page loads. */
  readonly source: Diagnostic["source"];
  /** Milliseconds the server waited for the answer. */
  readonly ms: number;
  /** Whether the assembly has a browser half that mounts. Absent where this server cannot say. */
  readonly browser?: boolean;
  /** How many placements this one accounts for, where a request refused the rest past its limit. */
  readonly refused?: number;
  /** The placements the answering assembly's own view made, each as it was answered. */
  readonly children?: OutlinePlacement[];
};
