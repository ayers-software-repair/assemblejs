// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** How one server describes an assembly to another. The whole handshake. */
export interface AssemblyManifest {
  /** The version of the specification, bumped only by a breaking change to the three endpoints. */
  readonly contract: number;
  readonly name: string;
  readonly view: string;
  /** The version of THIS assembly's output, for detecting skew during a rolling deploy. */
  readonly version: string;
  readonly views: readonly string[];
  readonly renderer: string;
  readonly assets: { readonly css: readonly string[]; readonly js: readonly string[] };
  readonly public: boolean;
}
