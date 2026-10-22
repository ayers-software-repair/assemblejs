// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { CONFIG_FILE } from "../discovery/config-file.js";
import { insideRoot } from "../root/inside-root.js";
import { OutsideRootError } from "../root/outside-root-error.js";

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
  const walk = (at: string, ancestors: ReadonlySet<string> = new Set()): void => {
    const directory = insideRoot(root, at);
    const real = realpathSync(directory);
    if (ancestors.has(real)) throw new OutsideRootError(relative(root, at), root);
    const beneath = new Set(ancestors).add(real);
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      // A link is followed where it leads; a directory is guarded before descent, and a file
      // before its read. One that leads nowhere is no source: check names it.
      const found = statSync(path, { throwIfNoEntry: false });
      if (found?.isDirectory() === true) walk(path, beneath);
      else if (found?.isFile() === true) files.push(path);
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
