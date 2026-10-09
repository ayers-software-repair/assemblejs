// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import type { Plugin } from "esbuild";
import { compileVue } from "./compile-vue.js";
import type { VueCompiler } from "./vue-compiler.js";

/**
 * Compiles each `.vue` file with the project's own Vue for the side being built. Its scope id is
 * derived from its path in the project, so the server and the browser bundle, built apart, give
 * a component the same one. Its styles are handed to `onCss`.
 */
export function vuePlugin(
  compiler: VueCompiler,
  root: string,
  side: "client" | "server",
  onCss?: (file: string, css: string) => void,
): Plugin {
  return {
    name: "assemblejs-vue",
    setup(build) {
      build.onLoad({ filter: /\.vue$/ }, async (args) => {
        const where = relative(root, args.path).split("\\").join("/");
        const id = createHash("sha256").update(where).digest("hex").slice(0, 8);
        const compiled = compileVue(compiler, await readFile(args.path, "utf8"), {
          filename: args.path,
          id,
          side,
        });
        if (compiled.css !== "") onCss?.(args.path, compiled.css);
        return { contents: compiled.code, loader: compiled.loader };
      });
    },
  };
}
