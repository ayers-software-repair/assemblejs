// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Where one assembly goes on a page, and the policy for getting it there. */
export interface AssemblyPlan {
  readonly name: string;
  readonly view: string;
  /** Present means the assembly lives on another server. */
  readonly url?: string;
  /** Milliseconds. Always finite. */
  readonly deadline: number;
  readonly fallback?: string;
  /** This placement failing fails the page. Opt-in, and the only way a page dies from a child. */
  readonly required?: boolean;
  /** Not fetched during the page render; the browser fills it after load. */
  readonly defer?: boolean;
  readonly cache?: { readonly ttl: number };
}
