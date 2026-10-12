// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { findPackage } from "./find-package.js";
import type { SolidCompile } from "./solid-compile.js";

/**
 * The compiler the project's own Solid renderer carries, or undefined when the project has none
 * installed. Solid's JSX compiles through Solid's own Babel preset, which the renderer depends on,
 * so a project that installs the renderer can build its views and the command line never ships
 * Babel to anyone else.
 */
export async function loadSolidCompiler(root: string): Promise<SolidCompile | undefined> {
  const renderer = findPackage(root, "@assemblejs/renderer-solid");
  if (renderer === undefined) return undefined;
  const path = createRequire(join(renderer, "package.json")).resolve(
    "@assemblejs/renderer-solid/compiler",
  );
  const loaded = (await import(pathToFileURL(path).href)) as { readonly compileSolid?: unknown };
  return typeof loaded.compileSolid === "function"
    ? (loaded.compileSolid as SolidCompile)
    : undefined;
}
