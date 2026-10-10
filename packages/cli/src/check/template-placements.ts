// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@assemblejs/core";
import { collectPlacements } from "./collect-placements.js";
import type { ViewPlacements } from "./view-placements.js";

// What each language writes an expression, a block or a comment of its own with.
const WRITTEN_BY_THE_ENGINE: Readonly<Record<string, RegExp>> = {
  ejs: /<%[\s\S]*?%>/g,
  handlebars: /\{\{\{[\s\S]*?\}\}\}|\{\{[\s\S]*?\}\}/g,
  nunjucks: /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/g,
};
// Stands where the engine will write something: a segment, so a directive holding it still reads.
const COMPUTED = "computed-by-the-template";

/**
 * The directives a template's source holds, read without the engine: everything the language
 * would compute is replaced by a marker, and what is left is read as a page's template is. A
 * view the template computes is left out of its placement; a name it computes is reported. A
 * directive inside a block is taken as placed, since some render places it.
 *
 * Nothing is read from a language that does not write the directive as HTML, which is Pug, or
 * from a source that does not read as one once the marker stands in: the render reads those.
 */
export function templatePlacements(renderer: string, source: string): ViewPlacements {
  const written = WRITTEN_BY_THE_ENGINE[renderer];
  if (written === undefined) return { placements: undefined, unnamed: [] };
  let found;
  try {
    found = findPlacements(source.replace(written, COMPUTED));
  } catch {
    return { placements: undefined, unnamed: [] };
  }
  return collectPlacements(
    found.map(({ name, view }) => ({
      name: name.includes(COMPUTED) ? undefined : name,
      view: view.includes(COMPUTED) ? undefined : view,
      shown: `<assembly name="..."></assembly> with a name the template computes`,
    })),
  );
}
