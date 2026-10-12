// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { CONFIG_FILE } from "../discovery/config-file.js";
import { insideRoot } from "../root/inside-root.js";

/**
 * The version of a build's output: a hash of every source file, the package manifest and the
 * project's config, by path
 * and content. The same sources always give the same version and any change gives a new one,
 * which is what a parent needs to notice that an assembly's output changed under it.
 */
export function sourceVersion(root: string): string {
  const hash = createHash("sha256");
  const files: string[] = [join(root, "package.json")];
  if (existsSync(join(root, CONFIG_FILE))) files.push(join(root, CONFIG_FILE));
  const walk = (at: string): void => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const path = join(at, entry.name);
      // A link is a path like any other, followed to where it leads; the read below refuses one
      // that leads out of the root.
      const found = statSync(path);
      if (found.isDirectory()) walk(path);
      else if (found.isFile()) files.push(path);
    }
  };
  walk(join(root, "src"));
  for (const file of files.sort()) {
    hash.update(relative(root, file).split("\\").join("/"));
    hash.update("\0");
    // The bytes, so a binary source hashes as itself; opened only where the path really leads.
    hash.update(readFileSync(insideRoot(root, file)));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}
