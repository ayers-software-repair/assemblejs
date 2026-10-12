// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { findPackage } from "./find-package.js";
import type { SvelteCompile } from "./svelte-compile.js";

/**
 * The project's own Svelte compiler, or undefined when the project has none installed. The
 * project's copy, never one of ours, so a view compiles with the Svelte its runtime will be.
 */
export async function loadSvelteCompiler(root: string): Promise<SvelteCompile | undefined> {
  const svelte = findPackage(root, "svelte");
  if (svelte === undefined) return undefined;
  // Resolved from inside the package, so its own exports map decides which file is the compiler.
  const path = createRequire(join(svelte, "package.json")).resolve("svelte/compiler");
  const loaded = (await import(pathToFileURL(path).href)) as {
    readonly compile?: SvelteCompile;
    readonly default?: { readonly compile?: SvelteCompile };
  };
  return loaded.compile ?? loaded.default?.compile;
}
