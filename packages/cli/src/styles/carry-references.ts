// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { ASSET_ROUTE_PREFIX } from "@assemblejs/core";
import postcss from "postcss";
import type { Io } from "../io/io.js";
import { insideDirectory } from "./inside-directory.js";
import { styleReferences } from "./style-references.js";

/**
 * A stylesheet with every file it names beside it copied into the build and named by the url it
 * is served from. The built sheet is served from the build, not from the assembly's directory,
 * so `url(./bg.png)` would otherwise point at nothing. Each copy is named by its content's hash,
 * so a changed file is a new url. Only a file inside `directory`, the assembly's own, is ever
 * copied; the build reports any other before it gets here, and this refuses it regardless.
 */
export function carryReferences(
  css: string,
  file: string,
  directory: string,
  root: string,
  io: Io,
): string {
  const parsed = postcss.parse(css, { from: file });
  parsed.walkDecls((declaration) => {
    let value = declaration.value;
    for (const reference of styleReferences(declaration.value)) {
      const [path = "", suffix = ""] = /^([^?#]*)(.*)$/.exec(reference)?.slice(1) ?? [];
      const source = resolve(dirname(file), path);
      if (!insideDirectory(directory, source)) {
        throw new Error(`${file} names ${reference}, which is outside ${directory}`);
      }
      const bytes = readFileSync(source);
      const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
      const name = `${basename(source, extname(source))}-${hash}${extname(source)}`;
      io.write(join(root, "dist", "client", "styles", "files", name), bytes);
      value = value.replace(reference, `${ASSET_ROUTE_PREFIX}/styles/files/${name}${suffix}`);
    }
    declaration.value = value;
  });
  return parsed.toString();
}
