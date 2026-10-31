// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lstatSync, opendirSync } from "node:fs";
import { join } from "node:path";

/** Confined regular source names for the provided fixture; never follows directory links. */
export function sourcePaths(root) {
  const paths = ["assemblejs.config.ts"];
  let entries = 0;
  const walk = (path) => {
    const directory = join(root, path);
    const stat = lstatSync(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error("linked source directory refused");
    const handle = opendirSync(directory);
    try {
      let entry;
      while ((entry = handle.readSync()) !== null) {
        if (++entries > 1024) throw new Error("fixture source tree exceeds 1024 entries");
        if (entry.name.startsWith(".")) continue;
        const relative = `${path}/${entry.name}`;
        if (relative.length > 256 || entry.name.includes("\\") || entry.name.includes(":"))
          throw new Error("fixture source path is outside the readable namespace");
        if (entry.isSymbolicLink()) throw new Error("linked source entry refused");
        if (entry.isDirectory()) walk(relative);
        else if (entry.isFile()) paths.push(relative);
        else throw new Error("non-regular source entry refused");
      }
    } finally {
      handle.closeSync();
    }
  };
  const config = lstatSync(join(root, paths[0]));
  if (!config.isFile() || config.isSymbolicLink()) throw new Error("linked config refused");
  walk("src");
  return paths.sort();
}
