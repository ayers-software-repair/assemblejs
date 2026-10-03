// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * The version of a build's output: a hash of every source file, the package manifest and the
 * project's config, by path
 * and content. The same sources always give the same version and any change gives a new one,
 * which is what a parent needs to notice that an assembly's output changed under it.
 */
export function sourceVersion(root: string): string {
  const hash = createHash("sha256");
  const files: string[] = [join(root, "package.json")];
  if (existsSync(join(root, "assemblejs.config.ts")))
    files.push(join(root, "assemblejs.config.ts"));
  const walk = (at: string): void => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = join(at, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  walk(join(root, "src"));
  for (const file of files.sort()) {
    hash.update(relative(root, file).split("\\").join("/"));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}
