// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** A framework renderer the build knows how to wire: its name and the package that holds it. */
export interface RendererPackage {
  readonly name: string;
  /** Exports `renderToMarkup(view, input)`, and `hydrate(view)` from its `/client` entry. */
  readonly package: string;
  /**
   * The framework's own package, where the build compiles a view with the compiler the project
   * installed (Svelte, Vue), so the project must have installed it for a view to build.
   */
  readonly compiler?: string;
  /**
   * A module of the package the page must load before any assembly's own, when the framework
   * needs one installed first (Lit's hydration support).
   */
  readonly browserSetup?: string;
  /**
   * Its views are templates, read as text and rendered by the package's
   * `renderTemplate(name, source, input)`, with no browser half of their own.
   */
  readonly template?: true;
}
