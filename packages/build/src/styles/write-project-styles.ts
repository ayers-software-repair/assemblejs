// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { ASSET_ROUTE_PREFIX } from "@asmjs/core";
import { COMPONENTS_FILE } from "../discovery/components-file.js";
import { TOKENS_FILE } from "../discovery/tokens-file.js";
import type { Io } from "../io/io.js";
import { readInside } from "../root/read-inside.js";
import { carryReferences } from "./carry-references.js";

/**
 * Writes the project's own stylesheets into the build, the tokens and then the components, and
 * answers the urls every page links them by, in that order; a project without one of the files
 * links the other alone, and one without either links nothing. Each sheet is written whole and
 * unscoped: the tokens are custom properties at `:root` that every assembly inherits, a shadow
 * root included, and the components style the elements HTML has, which every view writes, so a
 * selector scoped to an envelope would reach none of them. Every file a sheet names is carried
 * along as an assembly's would be, and each is named by its content's hash, so a change is a
 * new url.
 */
export function writeProjectStyles(root: string, io: Io): readonly string[] {
  const urls: string[] = [];
  for (const relative of [TOKENS_FILE, COMPONENTS_FILE]) {
    const file = join(root, relative);
    if (!existsSync(file)) continue;
    const css = `${carryReferences(readInside(root, file), file, dirname(file), root, io)}\n`;
    const hash = createHash("sha256").update(css).digest("hex").slice(0, 8);
    const name = `${basename(relative, ".css")}-${hash}.css`;
    io.write(join(root, "dist", "client", "styles", name), css);
    urls.push(`${ASSET_ROUTE_PREFIX}/styles/${name}`);
  }
  return urls;
}
