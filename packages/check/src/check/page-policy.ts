// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What a page's declaration says about its placements and its stream, as far as it is written. */
export interface PagePolicy {
  /** Each placement's policy, keyed by name, with what is computed left out. */
  readonly place: Readonly<Record<string, unknown>>;
  /** The placements from another server, each with its url when it is written. */
  readonly remote: ReadonlyMap<string, string | undefined>;
  /** The stream the page opens, when it is written. */
  readonly stream: string | undefined;
}
