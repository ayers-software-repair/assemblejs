// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { findPackage } from "./find-package.js";
import type { PugCompiler } from "./pug-compiler.js";

/**
 * The project's own Pug, the one its `@assemblejs/renderer-templates` renders with, or
 * undefined when the project has not installed that package or its Pug cannot be loaded, which
 * the build and the template rule each report on their own. The project's copy, never one of
 * ours, so a view is read by the Pug its server will render it with. Pug is CommonJS, so this
 * answers at once.
 *
 * Found as that package finds it: in `node_modules` beside where the package really is, which
 * under a package manager that links is not where the project's link to it stands, and in each
 * directory above. Never by asking node to resolve the name, which also looks wherever
 * `NODE_PATH` says, where a package manager's own store can answer for a Pug this project
 * never installed.
 */
export function loadPug(root: string): PugCompiler | undefined {
  const templates = findPackage(root, "@assemblejs/renderer-templates");
  if (templates === undefined) return undefined;
  try {
    const pug = findPackage(realpathSync(templates), "pug");
    if (pug === undefined) return undefined;
    const loaded = createRequire(join(pug, "package.json"))("./") as
      Partial<PugCompiler> | undefined;
    return typeof loaded?.compile === "function" ? (loaded as PugCompiler) : undefined;
  } catch {
    return undefined;
  }
}
