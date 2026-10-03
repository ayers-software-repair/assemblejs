// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { transform } from "esbuild";
import type { Plugin } from "esbuild";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { jsxSource } from "./jsx-source.js";
import type { SolidCompile } from "./solid-compile.js";

/**
 * Compiles each JSX file through its own framework's runtime, by naming that runtime at the top
 * of the file as esbuild reads it, so React and Preact assemblies build side by side in one
 * bundle without either borrowing the other's runtime. A Solid file has its types stripped and
 * its JSX compiled by the project's Solid compiler for the side being built. Files the project did
 * not write are left to the default.
 */
export function jsxPlugin(
  assemblies: readonly DiscoveredAssembly[],
  side: "client" | "server",
  solid?: SolidCompile,
): Plugin {
  return {
    name: "assemblejs-jsx",
    setup(build) {
      build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
        if (/[\\/]node_modules[\\/]/.test(args.path)) return undefined;
        const source = await readFile(args.path, "utf8");
        const loader = args.path.endsWith(".jsx") ? "jsx" : "tsx";
        const framework = jsxSource(args.path, assemblies);
        if (framework === "solid") {
          if (solid === undefined) {
            throw new Error(
              `${args.path} is Solid, and @assemblejs/renderer-solid is not installed`,
            );
          }
          const stripped = await transform(source, { loader, jsx: "preserve" });
          return { contents: solid(stripped.code, { filename: args.path, side }), loader: "js" };
        }
        return { contents: `/** @jsxImportSource ${framework} */\n${source}`, loader };
      });
    },
  };
}
