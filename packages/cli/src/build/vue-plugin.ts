// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import type { Plugin } from "esbuild";
import { compileVue } from "./compile-vue.js";
import { viewRefusal } from "./view-refusal.js";
import type { VueCompiler } from "./vue-compiler.js";

/**
 * Compiles each `.vue` file with the project's own Vue for the side being built. Its scope id is
 * derived from its path in the project, so the server and the browser bundle, built apart, give
 * a component the same one. Its styles are handed to `onCss`. A component Vue refuses is
 * reported at the component, on the line Vue names where it names one.
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
      const working = build.initialOptions.absWorkingDir ?? process.cwd();
      build.onLoad({ filter: /\.vue$/ }, async (args) => {
        const where = relative(root, args.path).split("\\").join("/");
        const id = createHash("sha256").update(where).digest("hex").slice(0, 8);
        const source = await readFile(args.path, "utf8");
        let compiled;
        try {
          compiled = compileVue(compiler, source, { filename: args.path, id, side });
        } catch (error) {
          return { errors: [viewRefusal(error, args.path, source, working)] };
        }
        if (compiled.css !== "") onCss?.(args.path, compiled.css);
        return { contents: compiled.code, loader: compiled.loader };
      });
    },
  };
}
