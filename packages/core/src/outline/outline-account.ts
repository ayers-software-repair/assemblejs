// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { OutlinePlacement } from "./outline-placement.js";

/**
 * How a page was composed, as the server that composed it tells the page's outline: written
 * onto the page after composition, once per request, and never into anything that is kept.
 */
export type OutlineAccount = {
  /** The page's route, as it was declared. */
  readonly route: string;
  /** Milliseconds the server took to compose the page. */
  readonly ms: number;
  /** The placements the page's template made, each as it was answered. */
  readonly placements: OutlinePlacement[];
};
