// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { BuildOptions } from "esbuild";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { Compilers } from "./compilers.js";
import { jsxPlugin } from "./jsx-plugin.js";
import { sveltePlugin } from "./svelte-plugin.js";
import { vuePlugin } from "./vue-plugin.js";

/**
 * What the browser and the server bundle agree on: the project root, JSX through each
 * framework's automatic runtime, a template read as text, and Svelte and Vue compiled for the
 * side being built. A stylesheet imported from JavaScript is left out of both: an assembly's styles are its
 * own `.css` files, scoped by the build, and a component's own `<style>`.
 */
export function sharedOptions(options: {
  readonly root: string;
  readonly side: "client" | "server";
  readonly assemblies: readonly DiscoveredAssembly[];
  readonly compilers: Compilers;
  readonly onCss?: (file: string, css: string) => void;
}): BuildOptions {
  const { compilers, side, onCss } = options;
  const plugins = [jsxPlugin(options.assemblies, side, compilers.solid)];
  if (compilers.svelte !== undefined) plugins.push(sveltePlugin(compilers.svelte, side, onCss));
  if (compilers.vue !== undefined)
    plugins.push(vuePlugin(compilers.vue, options.root, side, onCss));
  return {
    absWorkingDir: options.root,
    bundle: true,
    write: true,
    logLevel: "silent",
    jsx: "automatic",
    loader: {
      ".html": "text",
      ".md": "text",
      ".ejs": "text",
      ".hbs": "text",
      ".njk": "text",
      ".pug": "text",
      ".css": "empty",
    },
    plugins,
  };
}
