// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The one function of Pug the command line calls, typed here so it carries no dependency on
 * Pug: the project's own copy is loaded, and only when it has a Pug view. A plugin's `postParse`
 * is handed the tree Pug's parser made of the source, and what it answers is the tree Pug goes
 * on with.
 */
export interface PugCompiler {
  compile(
    source: string,
    options: { readonly plugins: readonly { postParse(tree: unknown): unknown }[] },
  ): unknown;
}
