// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { SvelteCompile } from "./svelte-compile.js";
import type { VueCompiler } from "./vue-compiler.js";

/** The project's own compilers for the views that need one, each present only when used. */
export interface Compilers {
  readonly svelte?: SvelteCompile;
  readonly vue?: VueCompiler;
}
