// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectProblem } from "@asmjs/build";
import { TAG_NAME_END, findPlacements, headEnd, inertSpans } from "@asmjs/core";
import type { PlacementPosition } from "./placement-position.js";
import { writeTag } from "./write-tag.js";

// A tag is read by its whole name, as the tokenizer reads one: `<body-card>` is not the body.
const opening = (name: string): RegExp =>
  new RegExp(`<${name}(?=${TAG_NAME_END})(?:[^>"']|"[^"]*"|'[^']*')*>`, "gi");
const closing = (name: string): RegExp => new RegExp(`</${name}(?=${TAG_NAME_END})[^>]*>`, "gi");
const BODY_OPEN = opening("body");
const BODY_CLOSE = closing("body");
const HTML_OPEN = opening("html");
const HTML_CLOSE = closing("html");
const HEAD_CLOSE = closing("head");

/**
 * The stretch of a template that a page shows, which is where a placement at its start or its
 * end goes: what its body holds, or, in a template that writes no body, what follows its head,
 * its html tag or its doctype, as far as the end of the document. A view has none of them, and
 * is the stretch whole. `within` says the stretch opens on the tag of the element that holds
 * it, and `closed` that it ends on one.
 */
const shown = (
  template: string,
): { from: number; to: number; within: boolean; opened: boolean; closed: boolean } => {
  const inert = inertSpans(template);
  const live = (tag: RegExp): RegExpExecArray[] =>
    [...template.matchAll(tag)].filter((found) => !inert(found.index));
  const head = live(HEAD_CLOSE).at(-1);
  const open = live(BODY_OPEN)[0] ?? head ?? live(HTML_OPEN)[0];
  const close = live(BODY_CLOSE).at(-1) ?? live(HTML_CLOSE).at(-1);
  // With no closing head tag, where a head ends is after the doctype, or the very start.
  const from = open === undefined ? headEnd(template) : open.index + open[0].length;
  return {
    from,
    to: close?.index ?? template.length,
    within: open !== undefined && open !== head,
    opened: from > 0,
    closed: close !== undefined,
  };
};

/**
 * A page template with one more placement in it, at a named position, or why it cannot be put
 * there; with how many times the template places that assembly now, as a second placing is
 * allowed and is not always meant. Beside a neighbour means beside that assembly's directive;
 * a neighbour the template does not place is a problem that lists the ones it does, never a
 * guess at where it meant. The tag is laid out as the file is: on a line of its own at the
 * indentation of what it stands beside, in the file's own line ending, and inline only where
 * what it stands beside shares its line.
 */
export function placeAssembly(
  template: string,
  name: string,
  position: PlacementPosition,
  path: string,
): { readonly template: string; readonly placed: number } | { readonly problem: ProjectProblem } {
  const tag = `<assembly name="${name}"></assembly>`;
  let placements;
  try {
    placements = findPlacements(template);
  } catch (error) {
    return {
      problem: {
        path,
        rule: "a-placement-names-an-assembly",
        message: error instanceof Error ? error.message : String(error),
        fix: 'write each placement as <assembly name="..."></assembly>',
      },
    };
  }
  const placed = placements.filter((placement) => placement.name === name).length + 1;

  if ("at" in position) {
    const { from, to, within, opened, closed } = shown(template);
    const content = template.slice(from, to);
    const first = content.search(/\S/);
    if (first === -1) {
      // Nothing is shown yet: the first child of the element that holds it, one step in.
      return opened || !closed
        ? { template: writeTag(template, tag, from, from, within), placed }
        : { template: writeTag(template, tag, to, to, true), placed };
    }
    const at = position.at === "start" ? from + first : from + content.trimEnd().length;
    return { template: writeTag(template, tag, at, position.at === "start" ? at : at - 1), placed };
  }

  const neighbour = "after" in position ? position.after : position.before;
  const found = placements.find((placement) => placement.name === neighbour);
  if (found === undefined) {
    const names = placements.map((placement) => placement.name);
    return {
      problem: {
        path,
        rule: "a-placement-names-an-assembly",
        message: `the template does not place "${neighbour}"`,
        fix:
          names.length === 0
            ? 'it places nothing yet; use { "at": "end" }'
            : `place it beside one it does: ${names.join(", ")}`,
      },
    };
  }
  const at = "after" in position ? found.end : found.start;
  return { template: writeTag(template, tag, at, found.start), placed };
}
