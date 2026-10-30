// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

/** Encodes the real pinned npm tree in the runtime's documented delivery format. */
export function packNpm(directory, output) {
  const pkg = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  if (pkg.name !== "npm" || pkg.version !== "10.9.2") throw new Error("expected real npm@10.9.2");
  readFileSync(join(directory, "bin/npm-cli.js"));
  const files = [];
  const chunks = [];
  let bytes = 0;
  const walk = (path, prefix) => {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const relative = prefix + entry.name;
      const absolute = join(path, entry.name);
      if (entry.isDirectory()) walk(absolute, relative + "/");
      else if (entry.isFile()) {
        const contents = readFileSync(absolute);
        files.push({ p: relative, o: bytes, l: contents.length });
        chunks.push(contents);
        bytes += contents.length;
        if (bytes > 64 * 1024 * 1024 || files.length > 10000)
          throw new Error("npm delivery exceeds probe limits");
      } else throw new Error(`unsupported npm entry: ${relative}`);
    }
  };
  walk(directory, "");
  const header = Buffer.from(JSON.stringify({ version: pkg.version, files }));
  if (header.length > 2 * 1024 * 1024) throw new Error("npm header exceeds probe limit");
  const length = Buffer.alloc(4);
  length.writeUInt32LE(header.length);
  const packed = gzipSync(Buffer.concat([length, header, ...chunks]));
  writeFileSync(output, packed);
  return {
    version: pkg.version,
    files: files.length,
    unpackedBytes: bytes,
    packedBytes: packed.length,
    sha256: createHash("sha256").update(packed).digest("hex"),
  };
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  if (!process.argv[2] || !process.argv[3])
    throw new Error("usage: pack-npm.mjs <npm directory> <output>");
  process.stdout.write(JSON.stringify(packNpm(process.argv[2], process.argv[3])) + "\n");
}
