// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What the cache holds for one placement: its answer, and what the answer is made of. */
export interface CachedContent {
  readonly html: string;
  readonly version?: string;
  /**
   * Each assembly the answering assembly's own view placed, at any depth, whose content the
   * answer holds: what a visitor must be let in to before the answer is theirs. Absent when it
   * was not recorded, and the answer is then no one's a control decides about.
   */
  readonly holds?: readonly { readonly name: string; readonly view: string }[];
}
