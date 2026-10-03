// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { BuildOptions } from "esbuild";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { jsxPlugin } from "./jsx-plugin.js";
import type { SvelteCompile } from "./svelte-compile.js";
import { sveltePlugin } from "./svelte-plugin.js";

/**
 * What the browser and the server bundle agree on: the project root, JSX through each
 * framework's automatic runtime, a template read as text, and Svelte compiled for the side being
 * built. A stylesheet imported from JavaScript is left out of both: an assembly's styles are its
 * own `.css` files, scoped by the build, and a component's own `<style>`.
 */
export function sharedOptions(options: {
  readonly root: string;
  readonly side: "client" | "server";
  readonly assemblies: readonly DiscoveredAssembly[];
  readonly svelte?: SvelteCompile | undefined;
  readonly onCss?: (file: string, css: string) => void;
}): BuildOptions {
  const plugins = [jsxPlugin(options.assemblies)];
  if (options.svelte !== undefined) {
    plugins.push(sveltePlugin(options.svelte, options.side, options.onCss));
  }
  return {
    absWorkingDir: options.root,
    bundle: true,
    write: true,
    logLevel: "silent",
    jsx: "automatic",
    loader: { ".html": "text", ".md": "text", ".css": "empty" },
    plugins,
  };
}
