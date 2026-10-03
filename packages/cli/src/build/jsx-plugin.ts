// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import type { Plugin } from "esbuild";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { jsxSource } from "./jsx-source.js";

/**
 * Compiles each JSX file through its own framework's runtime, by naming that runtime at the top
 * of the file as esbuild reads it, so React and Preact assemblies build side by side in one
 * bundle without either borrowing the other's runtime. Files the project did not write are left
 * to the default.
 */
export function jsxPlugin(assemblies: readonly DiscoveredAssembly[]): Plugin {
  return {
    name: "assemblejs-jsx",
    setup(build) {
      build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
        if (/[\\/]node_modules[\\/]/.test(args.path)) return undefined;
        const source = await readFile(args.path, "utf8");
        return {
          contents: `/** @jsxImportSource ${jsxSource(args.path, assemblies)} */\n${source}`,
          loader: args.path.endsWith(".jsx") ? "jsx" : "tsx",
        };
      });
    },
  };
}
