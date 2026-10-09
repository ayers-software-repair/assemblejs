// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Policy for one placement on one page. Every field is optional, because a local placement
 * needs no entry at all: the template alone is enough.
 */
export interface PagePlacement {
  /** Present means the assembly lives on another server. */
  readonly url?: string;
  /** Milliseconds, finite. The composer's default when absent. */
  readonly deadline?: number;
  /** Markup shown when the assembly does not answer. */
  readonly fallback?: string;
  /** This placement failing fails the page. */
  readonly required?: boolean;
  /** Not fetched during the page render; the browser fills it after load. */
  readonly defer?: boolean;
  readonly cache?: { readonly ttl: number };
}
