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
 * its decorators lowered, which Solid's compiler does not read, and its JSX compiled by the
 * project's Solid compiler for the side being built.
 *
 * A file that neither names its framework nor sits in an assembly's directory (a component shared
 * from elsewhere in the project) takes the framework of whatever imports it by a relative path;
 * one imported from two frameworks is an error naming both, as one file cannot compile two ways;
 * one nothing decides, one reached through a path alias among them, is React. Files the project
 * did not write are left to the default.
 */
export function jsxPlugin(
  assemblies: readonly DiscoveredAssembly[],
  side: "client" | "server",
  solid?: SolidCompile,
): Plugin {
  // For each project file, the frameworks of the files that import it, and what it compiled as.
  const wanted = new Map<string, Set<string>>();
  const compiled = new Map<string, string>();
  const frameworkOf = (file: string): string | undefined =>
    jsxSource(file, assemblies) ?? compiled.get(file) ?? single(wanted.get(file));
  return {
    name: "assemblejs-jsx",
    setup(build) {
      build.onResolve({ filter: /^\.\.?\// }, async (args) => {
        if (args.pluginData === RESOLVING || args.importer === "") return undefined;
        const resolved = await build.resolve(args.path, {
          importer: args.importer,
          resolveDir: args.resolveDir,
          kind: args.kind,
          pluginData: RESOLVING,
        });
        const file = resolved.path;
        if (resolved.errors.length > 0 || !/\.[jt]sx$/.test(file) || jsxSource(file, assemblies)) {
          return undefined;
        }
        const framework = frameworkOf(args.importer);
        if (framework === undefined) return undefined;
        const frameworks = wanted.get(file) ?? new Set<string>();
        frameworks.add(framework);
        wanted.set(file, frameworks);
        const done = compiled.get(file);
        if (done !== undefined && done !== framework) {
          return { errors: [{ text: conflict(file, [done, framework]) }] };
        }
        return undefined;
      });
      build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
        if (/[\\/]node_modules[\\/]/.test(args.path)) return undefined;
        const frameworks = wanted.get(args.path);
        if (jsxSource(args.path, assemblies) === undefined && (frameworks?.size ?? 0) > 1) {
          throw new Error(conflict(args.path, [...(frameworks ?? [])]));
        }
        const framework = frameworkOf(args.path) ?? "react";
        compiled.set(args.path, framework);
        const source = await readFile(args.path, "utf8");
        const loader = args.path.endsWith(".jsx") ? "jsx" : "tsx";
        if (framework === "solid") {
          if (solid === undefined) {
            throw new Error(
              `${args.path} is Solid, and @assemblejs/renderer-solid is not installed`,
            );
          }
          const stripped = await transform(source, { loader, jsx: "preserve", target: "es2022" });
          return { contents: solid(stripped.code, { filename: args.path, side }), loader: "js" };
        }
        // On the first line, so every line of the file keeps its number in a diagnostic.
        return { contents: `/** @jsxImportSource ${framework} */ ${source}`, loader };
      });
    },
  };
}

// Marks the resolution this plugin asks for itself, so it does not see its own request.
const RESOLVING = Symbol("assemblejs-jsx resolving");

function single(frameworks: ReadonlySet<string> | undefined): string | undefined {
  return frameworks?.size === 1 ? [...frameworks][0] : undefined;
}

function conflict(file: string, frameworks: readonly string[]): string {
  return `${file} is imported by ${[...new Set(frameworks)].sort().join(" and ")} assemblies and can compile only one way: name its framework (a .preact.tsx, .react.tsx or .solid.tsx) or keep a copy in each assembly`;
}
