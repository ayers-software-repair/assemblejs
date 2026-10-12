// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * The directory of a package the project has installed, found the way the bundler finds it: in
 * `node_modules` beside the project and each directory above it. Never through `NODE_PATH`,
 * which a package manager's command shims set to its own store, where a package the project never
 * installed can be found by node and then not by the bundler.
 */
export function findPackage(root: string, name: string): string | undefined {
  let at = root;
  for (;;) {
    const candidate = join(at, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return candidate;
    const parent = dirname(at);
    if (parent === at) return undefined;
    at = parent;
  }
}
