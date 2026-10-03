// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** A framework renderer the build knows how to wire: its name and the package that holds it. */
export interface RendererPackage {
  readonly name: string;
  /** Exports `renderToMarkup(view, input)`, and `hydrate(view)` from its `/client` entry. */
  readonly package: string;
}
