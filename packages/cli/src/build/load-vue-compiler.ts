// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { findPackage } from "./find-package.js";
import type { VueCompiler } from "./vue-compiler.js";

/**
 * The project's own single-file component compiler, or undefined when the project has no Vue
 * installed. The project's copy, never one of ours, so a component compiles with the Vue its
 * runtime will be.
 */
export async function loadVueCompiler(root: string): Promise<VueCompiler | undefined> {
  const vue = findPackage(root, "vue");
  if (vue === undefined) return undefined;
  // Resolved from inside the package, so its own exports map decides which file is the compiler.
  const path = createRequire(join(vue, "package.json")).resolve("vue/compiler-sfc");
  const loaded = (await import(pathToFileURL(path).href)) as Partial<VueCompiler> & {
    readonly default?: Partial<VueCompiler>;
  };
  const compiler = typeof loaded.parse === "function" ? loaded : loaded.default;
  return typeof compiler?.parse === "function" ? (compiler as VueCompiler) : undefined;
}
