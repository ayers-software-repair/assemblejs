// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The parts of a parsed single-file component a build reads, as Vue's compiler describes them. */
export interface VueDescriptor {
  readonly script: { readonly lang?: string } | null;
  readonly scriptSetup: { readonly lang?: string } | null;
  readonly template: { readonly content: string } | null;
  readonly styles: readonly { readonly content: string; readonly scoped?: boolean }[];
}
