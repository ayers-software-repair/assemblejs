// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/** Hashes every published JavaScript module, including split chunks and client entry points. */
export async function moduleHashes(directory) {
  const hashes = {};
  const walk = async (path, prefix) => {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error("published modules must not be symlinks");
      const file = join(path, entry.name);
      const relative = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await walk(file, `${relative}/`);
      else if (entry.isFile() && entry.name.endsWith(".js"))
        hashes[relative] = createHash("sha256")
          .update(await readFile(file))
          .digest("hex");
    }
  };
  await walk(directory, "");
  if (!hashes["index.js"]) throw new Error("a source package needs its actual JavaScript entry");
  return hashes;
}
