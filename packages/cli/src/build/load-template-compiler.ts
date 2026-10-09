// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { findPackage } from "./find-package.js";
import type { TemplateCompilerLoader } from "./template-compiler-loader.js";

/**
 * The project's own `@assemblejs/renderer-templates`, or undefined when the project has none
 * installed, which the build reports on its own. The project's copy, never one of ours, so a
 * template compiles with the engines its server will render it with.
 */
export async function loadTemplateCompiler(
  root: string,
): Promise<TemplateCompilerLoader | undefined> {
  const found = findPackage(root, "@assemblejs/renderer-templates");
  if (found === undefined) return undefined;
  // Resolved from inside the package, so its own exports map decides which file is the entry.
  const path = createRequire(join(found, "package.json")).resolve("@assemblejs/renderer-templates");
  const loaded = (await import(pathToFileURL(path).href)) as {
    readonly loadCompiler?: TemplateCompilerLoader;
  };
  return loaded.loadCompiler;
}
