// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * One element a view's source writes, as far as that can be read without rendering it: its tag,
 * its attributes as written, a bare one `true`, and whether the template computes any part of
 * the tag, in which case a rule that reads it knows a render may write more. `at` is where the
 * tag starts in the markup read, for a finding to point near.
 */
export interface ViewElement {
  readonly tag: string;
  readonly attributes: ReadonlyMap<string, string | true>;
  readonly at: number;
  readonly computed: boolean;
}
