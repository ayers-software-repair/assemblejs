// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ASSET_ROUTE_PREFIX } from "@assemblejs/core";
import { TOKENS_FILE } from "../discovery/tokens-file.js";
import type { Io } from "../io/io.js";
import { carryReferences } from "./carry-references.js";

/**
 * Writes the project's tokens into the build and answers the url every page links them by, or
 * nothing for a project without the file. The sheet is written whole and unscoped: its custom
 * properties sit at `:root` so that every assembly inherits them, in a shadow root too, and a
 * selector scoped to an envelope would reach none of them. Every file it names is carried along
 * as an assembly's would be, and the file is named by its content's hash, so a changed token is a
 * new url.
 */
export function writeTokens(root: string, io: Io): string | undefined {
  const file = join(root, TOKENS_FILE);
  if (!existsSync(file)) return undefined;
  const css = `${carryReferences(readFileSync(file, "utf8"), file, dirname(file), root, io)}\n`;
  const hash = createHash("sha256").update(css).digest("hex").slice(0, 8);
  const name = `tokens-${hash}.css`;
  io.write(join(root, "dist", "client", "styles", name), css);
  return `${ASSET_ROUTE_PREFIX}/styles/${name}`;
}
