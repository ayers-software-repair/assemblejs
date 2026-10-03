// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The browser files an assembly needs, as the urls a page links them by.
 *
 * Reported in the manifest and hoisted into every page that places the assembly, once per page
 * however many times it is placed. An assembly with none ships no JavaScript at all.
 */
export interface AssemblyAssets {
  readonly css: readonly string[];
  readonly js: readonly string[];
}
