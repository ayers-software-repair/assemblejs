// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { rendererForView } from "./renderer-for-view.js";

/**
 * Which of an assembly directory's view files is its view, or undefined when they do not say.
 *
 * One alone is the view. Among several, the view is the one named after the assembly, and the
 * rest are its own components, written for the same framework: `cart.svelte` beside
 * `cart-row.svelte`, or `cart.lit.ts` beside `price.lit.ts`. A file for another framework, or
 * no file named after the assembly, leaves it undecided.
 */
export function pickView(name: string, files: readonly string[]): string | undefined {
  if (files.length === 1) return files[0];
  const named = files.filter((file) => {
    const parts = file.split(".");
    return (
      parts[0] === name &&
      (parts.length === 2 || (parts.length === 3 && parts[1] === rendererForView(file)))
    );
  });
  const view = named.length === 1 ? named[0] : undefined;
  if (view === undefined) return undefined;
  const renderer = rendererForView(view);
  return files.every((file) => rendererForView(file) === renderer) ? view : undefined;
}
