// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a page may send a visitor before anything mounts, in gzipped bytes by part: the document,
 * the stylesheets it links and the module scripts it links, each from the page's own origin.
 * `perf` weighs the production build and holds every page to these; a part without a budget is
 * weighed and not held. Nothing on the server reads them.
 */
export interface PageBudgets {
  readonly document?: number;
  readonly styles?: number;
  readonly scripts?: number;
}
