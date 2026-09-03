// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// A view's extension picks its renderer. Where an extension is shared, the filename says which,
// so a page's frameworks are visible from a directory listing rather than from a config file.
const BY_EXTENSION: Readonly<Record<string, string>> = {
  ".html": "html",
  ".svelte": "svelte",
  ".vue": "vue",
  ".md": "markdown",
};
const AMBIGUOUS = new Set([".tsx", ".jsx"]);

/**
 * The renderer a view file declares, or undefined when the file is not a view.
 *
 * `cart.svelte` needs no infix because the extension is unambiguous. `cart.react.tsx` does,
 * because React, Preact and Solid all write .tsx and a file that does not say which is a file
 * whose framework only the config knows.
 */
export function rendererForView(fileName: string): string | undefined {
  const extension = fileName.slice(fileName.lastIndexOf("."));
  if (extension === "" || !fileName.includes(".")) return undefined;

  if (AMBIGUOUS.has(extension)) {
    const parts = fileName.slice(0, -extension.length).split(".");
    const infix = parts.length > 1 ? parts.at(-1) : undefined;
    return infix === undefined || infix === "" ? undefined : infix;
  }
  return BY_EXTENSION[extension];
}
