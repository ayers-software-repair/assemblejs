// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { manifestOf } from "./manifest-of.js";

/**
 * The manifest of a package a project installs, read where its package manager put it. That is
 * through the manager's own links, which lead wherever it keeps packages, a workspace's root or
 * a store beside it, so this read is not held to the project's root: installed packages are
 * the one thing `check` finds, reads and loads outside it. Only a name, a version and what the
 * package depends on are taken from a manifest, and none of them where there is none.
 */
export function installedManifest(root: string, name: string): ReturnType<typeof manifestOf> {
  let source: string | undefined;
  try {
    source = readFileSync(join(root, "node_modules", name, "package.json"), "utf8");
  } catch {
    source = undefined;
  }
  return manifestOf(source);
}
