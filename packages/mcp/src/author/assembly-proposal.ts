// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Exact additions retained for one review; no existing file is replaced by this operation. */
export interface AssemblyProposal {
  readonly id: string;
  readonly name: string;
  readonly renderer: string;
  readonly tag: string;
  readonly changes: readonly {
    readonly path: string;
    readonly before: null;
    readonly after: string;
  }[];
}
