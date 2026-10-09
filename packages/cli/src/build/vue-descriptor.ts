// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The parts of a parsed single-file component a build reads, as Vue's compiler describes them. */
export interface VueDescriptor {
  readonly script: VueBlock | null;
  readonly scriptSetup: VueBlock | null;
  readonly template: (VueBlock & { readonly content: string }) | null;
  readonly styles: readonly (VueBlock & {
    readonly content: string;
    readonly scoped?: boolean;
    readonly module?: string | boolean;
  })[];
  /** The expressions `v-bind()` in the component's styles reads. */
  readonly cssVars: readonly string[];
}

/** What every block of a single-file component may say about itself. */
interface VueBlock {
  readonly lang?: string;
  readonly src?: string;
}
