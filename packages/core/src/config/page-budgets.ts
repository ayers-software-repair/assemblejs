// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a page may send a visitor, in gzipped bytes by part: before anything mounts, its
 * `document`, its `styles` and its `scripts`; then `mount`, what its assemblies fetch as they
 * mount; and `total`, all of it. `perf` holds every page to these; a part without a budget is
 * weighed and not held. Nothing on the server reads them.
 */
export interface PageBudgets {
  readonly document?: number;
  readonly styles?: number;
  readonly scripts?: number;
  readonly mount?: number;
  readonly total?: number;
}
