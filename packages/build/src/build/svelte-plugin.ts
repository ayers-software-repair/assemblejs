// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import type { Plugin } from "esbuild";
import type { SvelteCompile } from "./svelte-compile.js";
import { viewRefusal } from "./view-refusal.js";

/**
 * Compiles each `.svelte` file with the project's compiler: for the server bundle, the server
 * output a renderer renders to a string; for the browser bundle, the client output it hydrates.
 * A component's own `<style>`, which Svelte has already scoped to it, is handed to `onCss`.
 * A view the compiler refuses is reported at the view, on the line the compiler names.
 */
export function sveltePlugin(
  compile: SvelteCompile,
  generate: "client" | "server",
  onCss?: (file: string, css: string) => void,
): Plugin {
  return {
    name: "assemblejs-svelte",
    setup(build) {
      const working = build.initialOptions.absWorkingDir ?? process.cwd();
      build.onLoad({ filter: /\.svelte$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");
        let compiled;
        try {
          compiled = compile(source, { filename: args.path, generate });
        } catch (error) {
          return { errors: [viewRefusal(error, args.path, source, working)] };
        }
        if (compiled.css?.code !== undefined && compiled.css.code !== "") {
          onCss?.(args.path, compiled.css.code);
        }
        return { contents: compiled.js.code, loader: "js" };
      });
    },
  };
}
