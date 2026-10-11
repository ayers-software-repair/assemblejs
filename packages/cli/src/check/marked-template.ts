// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PugCompiler } from "../build/pug-compiler.js";
import { COMPUTED_MARKER } from "./computed-marker.js";
import { pugMarkup } from "./pug-markup.js";
import { pugTree } from "./pug-tree.js";

// What each language writes an expression, a block or a comment of its own with.
const WRITTEN_BY_THE_ENGINE: Readonly<Record<string, RegExp>> = {
  ejs: /<%[\s\S]*?%>/g,
  handlebars: /\{\{\{[\s\S]*?\}\}\}|\{\{[\s\S]*?\}\}/g,
  nunjucks: /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g,
};

/**
 * A template's source as markup, the marker standing wherever its language computes what it
 * writes, or undefined where that cannot be had: a renderer that is not a template language, or
 * Pug with no Pug of the project's to read it, or a source Pug cannot compile. Pug does not write
 * its markup as HTML, so its markup is read off the tree the project's own Pug makes of the
 * source. A plain html view is its own markup, with nothing computed.
 */
export function markedTemplate(
  renderer: string,
  source: string,
  pug: PugCompiler | undefined,
): string | undefined {
  if (renderer === "html") return source;
  const written = WRITTEN_BY_THE_ENGINE[renderer];
  if (written !== undefined) return source.replace(written, COMPUTED_MARKER);
  if (renderer !== "pug" || pug === undefined) return undefined;
  const tree = pugTree(pug, source);
  return tree === undefined ? undefined : pugMarkup(tree, COMPUTED_MARKER);
}
