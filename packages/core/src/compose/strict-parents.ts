// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { inertSpans } from "./inert-spans.js";

// The parts of a table that hold only other parts of it: anything else written directly in one
// is moved out of the table by the parser.
const HOLDS_PARTS = new Set(["table", "thead", "tbody", "tfoot", "tr", "colgroup"]);
// What a new part of a table ends, where the author left its end tag out.
const ENDED_BY_SECTION = new Set([
  "caption",
  "colgroup",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
]);
const ENDED_BY_ROW = new Set(["caption", "colgroup", "tr", "td", "th"]);
const ENDED_BY_CELL = new Set(["caption", "colgroup", "td", "th"]);
const TRACKED = new Set([...ENDED_BY_SECTION, "table", "select", "template"]);
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/g;

/**
 * Where a template stands directly inside an element the parser holds to a strict content:
 * a table outside its cells, named by the part of the table it stands in, or anywhere in a
 * `select`. Undefined everywhere else.
 *
 * An element the parser does not expect in a table, an envelope among them, is moved out
 * before the table, and the rows or cells written inside it stay in the table: the envelope
 * arrives empty, its island beside what it was to hold (html.spec.whatwg.org, parsing, "foster
 * parenting", read 2026-10-12, and seen in Chromium). Inside a `select` browsers do not yet
 * agree on what is kept. So a placement in either is refused where the directive is read. One
 * pass over the template. Only the table's own parts are followed, so a placement inside any
 * other element written directly in a table, which the parser moves out with it, is refused
 * too: it is outside the cells all the same. A tag inside a comment or a raw-text element is
 * no tag, by the reading of them it is handed or its own.
 */
export function strictParents(
  template: string,
  inert: (at: number) => boolean = inertSpans(template),
): (at: number) => string | undefined {
  // Each point where the answer changes, in order, with the answer from there on.
  const marks: Array<readonly [number, string | undefined]> = [];
  const open: string[] = [];
  const endWhile = (ended: ReadonlySet<string>): void => {
    while (ended.has(open.at(-1) ?? "")) open.pop();
  };
  TAG.lastIndex = 0;
  for (const match of template.matchAll(TAG)) {
    const [, slash, raw = ""] = match;
    const tag = raw.toLowerCase();
    if (!TRACKED.has(tag) || inert(match.index)) continue;
    if (slash === "/") {
      const at = open.lastIndexOf(tag);
      if (at !== -1) open.length = at;
    } else if (tag === "table" || tag === "template") {
      open.push(tag);
    } else if (tag === "select") {
      if (!open.includes("select")) open.push(tag);
    } else {
      endWhile(
        tag === "tr"
          ? ENDED_BY_ROW
          : tag === "td" || tag === "th"
            ? ENDED_BY_CELL
            : ENDED_BY_SECTION,
      );
      // A part written where no table is open is no part of one, and the parser ignores it.
      if (HOLDS_PARTS.has(open.at(-1) ?? "")) open.push(tag);
    }
    const innermost = open.at(-1);
    const answer =
      innermost !== undefined && HOLDS_PARTS.has(innermost)
        ? innermost
        : open.includes("select")
          ? "select"
          : undefined;
    if (marks.at(-1)?.[1] !== answer) marks.push([match.index + 1, answer]);
  }
  return (at) => {
    let low = 0;
    let high = marks.length - 1;
    let answer: string | undefined;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const [from, said] = marks[middle] ?? [0, undefined];
      if (from <= at) {
        answer = said;
        low = middle + 1;
      } else high = middle - 1;
    }
    return answer;
  };
}
