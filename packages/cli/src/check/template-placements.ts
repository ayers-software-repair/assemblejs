// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@assemblejs/core";
import type { PugCompiler } from "../build/pug-compiler.js";
import { collectPlacements } from "./collect-placements.js";
import { pugMarkup } from "./pug-markup.js";
import { pugTree } from "./pug-tree.js";
import type { ViewPlacements } from "./view-placements.js";

// What each language writes an expression, a block or a comment of its own with.
const WRITTEN_BY_THE_ENGINE: Readonly<Record<string, RegExp>> = {
  ejs: /<%[\s\S]*?%>/g,
  handlebars: /\{\{\{[\s\S]*?\}\}\}|\{\{[\s\S]*?\}\}/g,
  nunjucks: /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g,
};
// Stands where the engine will write something: a segment, so a directive holding it still reads.
const COMPUTED = "computed-by-the-template";
const UNREAD: ViewPlacements = { placements: undefined, unnamed: [] };

/**
 * A template's source as markup, the marker standing wherever its language computes what it
 * writes, or undefined where that cannot be had. Pug does not write the directive as HTML, so
 * its markup is read off the tree the project's own Pug makes of the source.
 */
function marked(
  renderer: string,
  source: string,
  pug: PugCompiler | undefined,
): string | undefined {
  const written = WRITTEN_BY_THE_ENGINE[renderer];
  if (written !== undefined) return source.replace(written, COMPUTED);
  if (renderer !== "pug" || pug === undefined) return undefined;
  const tree = pugTree(pug, source);
  return tree === undefined ? undefined : pugMarkup(tree, COMPUTED);
}

/**
 * The directives a template's source holds, read without rendering it: everything the language
 * would compute is replaced by a marker, and what is left is read as a page's template is. A
 * view the template computes is left out of its placement; a name it computes is reported. A
 * directive inside a block is taken as placed, since some render places it.
 *
 * Throws for a directive that does not read as it is written, with nothing computed in it:
 * every render that reaches it fails on it. One that does not read and holds something the
 * template computes is what only a render knows, since what is computed may be what makes it
 * read: that view is unread, and left to its render. So is a Pug source with no Pug of the
 * project's to read it, or one Pug cannot compile, which the template's own rule reports.
 */
export function templatePlacements(
  renderer: string,
  source: string,
  pug?: PugCompiler,
): ViewPlacements {
  let markup = marked(renderer, source, pug);
  if (markup === undefined) return UNREAD;
  let unknown = false;
  for (;;) {
    try {
      const found = findPlacements(markup);
      if (unknown) return UNREAD;
      return collectPlacements(
        found.map(({ name, view }) => ({
          name: name.includes(COMPUTED) ? undefined : name,
          view: view.includes(COMPUTED) ? undefined : view,
          shown: `<assembly name="..."></assembly> with a name the template computes`,
        })),
      );
    } catch (error) {
      const said = error instanceof Error ? error.message : String(error);
      const at = Number(/ at (\d+)/.exec(said)?.[1]);
      // The directive as far as its own text runs: its tag, and what stands before the next.
      const directive: string = /^<[^>]*>?[^<]*/.exec(markup.slice(at))?.[0] ?? "";
      if (Number.isNaN(at) || !directive.includes(COMPUTED)) {
        // Where it stands in the marked source is nowhere its author can look.
        const where = said.replace(/ at \d+/, "");
        throw new Error(`once what the template computes is set aside, ${where}`, { cause: error });
      }
      // Set aside, for the directives after it to be read.
      unknown = true;
      markup = `${markup.slice(0, at)}${" ".repeat(directive.length)}${markup.slice(at + directive.length)}`;
    }
  }
}
