// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// The frameworks whose views are JSX, each with a JSX of its own: React's, Preact's, and
// Solid's, which only Solid's own compiler reads.
const JSX_FRAMEWORKS: readonly string[] = ["react", "preact", "solid"];

/**
 * The owner of a renderer's JSX, when it has one: the framework whose runtime and types its
 * `.tsx` files are compiled and checked against. Undefined for a renderer with no JSX, whose
 * view is markup, a template or a module with no JSX in it.
 */
export function jsxOwner(renderer: string): string | undefined {
  return JSX_FRAMEWORKS.includes(renderer) ? renderer : undefined;
}
