// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join, relative, resolve } from "node:path";
import { ASSET_ROUTE_PREFIX } from "@assemblejs/core";
import { build } from "esbuild";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { generateClientEntry } from "../generate/generate-client-entry.js";
import { generateClientModule } from "../generate/generate-client-module.js";
import type { Io } from "../io/io.js";
import { RENDERER_PACKAGES } from "./renderer-packages.js";
import { sharedOptions } from "./shared-options.js";
import type { SvelteCompile } from "./svelte-compile.js";

/**
 * Writes each assembly's browser half as its own module and bundles them behind one entry, split
 * so each assembly is its own file. Answers the entry's url, the one script a page links.
 */
export async function bundleClient(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
  svelte: SvelteCompile | undefined,
  io: Io,
  onCss?: (file: string, css: string) => void,
): Promise<string> {
  const generated = join(root, ".assemblejs");
  for (const assembly of assemblies) {
    io.write(
      join(generated, "client", `${assembly.name}.ts`),
      generateClientModule(
        assembly,
        join(generated, "client"),
        RENDERER_PACKAGES[assembly.renderer]?.package,
      ),
    );
  }
  io.write(join(generated, "client.ts"), generateClientEntry(assemblies));

  const outdir = join(root, "dist", "client");
  const result = await build({
    ...sharedOptions({
      root,
      side: "client",
      assemblies,
      svelte,
      ...(onCss === undefined ? {} : { onCss }),
    }),
    entryPoints: [join(generated, "client.ts")],
    platform: "browser",
    format: "esm",
    target: "es2022",
    splitting: true,
    minify: true,
    outdir,
    entryNames: "[name]-[hash]",
    chunkNames: "chunks/[name]-[hash]",
    metafile: true,
  });
  // By name, not by position: each island's chunk names its own module as its entry point too.
  const entry = Object.entries(result.metafile.outputs).find(
    ([path, output]) => output.entryPoint === ".assemblejs/client.ts" && path.endsWith(".js"),
  )?.[0];
  if (entry === undefined) throw new Error("the browser bundle produced no entry");
  return `${ASSET_ROUTE_PREFIX}/${relative(outdir, resolve(root, entry)).split("\\").join("/")}`;
}
