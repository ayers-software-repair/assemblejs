// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@asmjs/core";
import type { PugCompiler } from "../build/pug-compiler.js";
import { collectPlacements } from "./collect-placements.js";
import { COMPUTED_MARKER } from "./computed-marker.js";
import { markedTemplate } from "./marked-template.js";
import type { ViewPlacements } from "./view-placements.js";

const UNREAD: ViewPlacements = { placements: undefined, unnamed: [] };

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
  let markup = markedTemplate(renderer, source, pug);
  if (markup === undefined) return UNREAD;
  let unknown = false;
  for (;;) {
    try {
      const found = findPlacements(markup);
      if (unknown) return UNREAD;
      return collectPlacements(
        found.map(({ name, view }) => ({
          name: name.includes(COMPUTED_MARKER) ? undefined : name,
          view: view.includes(COMPUTED_MARKER) ? undefined : view,
          shown: `<assembly name="..."></assembly> with a name the template computes`,
        })),
      );
    } catch (error) {
      const said = error instanceof Error ? error.message : String(error);
      const at = Number(/ at (\d+)/.exec(said)?.[1]);
      // The directive as far as its own text runs: its tag, and what stands before the next.
      const directive: string = /^<[^>]*>?[^<]*/.exec(markup.slice(at))?.[0] ?? "";
      if (Number.isNaN(at) || !directive.includes(COMPUTED_MARKER)) {
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
