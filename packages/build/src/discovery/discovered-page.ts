// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** One page found on disk: its template, and the file declaring its route and policy if any. */
export interface DiscoveredPage {
  readonly name: string;
  /** `/` for `home`, `/<name>` otherwise, unless the page's own file says different. */
  readonly route: string;
  /** The template, relative to the project root. */
  readonly template: string;
  /** `<name>.page.ts`, relative to the project root, when the page has one. */
  readonly declaration: string | undefined;
}
