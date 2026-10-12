// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { inertSpans } from "./inert-spans.js";
import { withinSpans } from "./within-spans.js";

// The start tags that close an open p element, from the HTML parser's "in body" insertion mode
// (html.spec.whatwg.org, parsing, read 2026-10-11: each rule opens "If the stack of open
// elements has a p element in button scope, then close a p element").
const START_CLOSES = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "center",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "header",
  "hgroup",
  "main",
  "menu",
  "nav",
  "ol",
  "p",
  "search",
  "section",
  "summary",
  "ul",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "pre",
  "listing",
  "plaintext",
  "hr",
  "xmp",
]);
// The end tags that close it too, by generating implied end tags: the end of the paragraph itself,
// of any element above, and of the list, table, form and button parts whose end tag rules do so.
const END_CLOSES = new Set([
  ...START_CLOSES,
  "li",
  "dd",
  "dt",
  "td",
  "th",
  "tr",
  "tbody",
  "thead",
  "tfoot",
  "caption",
  "form",
  "table",
  "button",
  "body",
  "html",
]);
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/g;

/**
 * Where a template stands inside a paragraph the parser has not yet closed: after a `<p>` start
 * tag, with no `</p>`, no start tag that closes a paragraph and no end tag that does between. The
 * browser closes such a paragraph at the first block the placed assembly holds, and the rest of
 * the assembly, its island included, leaves its envelope; so a placement there is refused where
 * the directive is read. One pass over the template, so a page of ten thousand placements is
 * answered as fast as one. Tags inside a comment or a raw-text element are not tags, by the
 * reading of them it is handed or its own. An end tag of an element opened inside the paragraph
 * leaves it open, as the parser does.
 */
export function openParagraphs(
  template: string,
  inert: (at: number) => boolean = inertSpans(template),
): (at: number) => boolean {
  const spans: Array<readonly [number, number]> = [];
  let openedAt: number | undefined;
  TAG.lastIndex = 0;
  for (const match of template.matchAll(TAG)) {
    if (inert(match.index)) continue;
    const [, slash, raw = ""] = match;
    const tag = raw.toLowerCase();
    const closes = slash === "/" ? END_CLOSES.has(tag) : tag === "p" || START_CLOSES.has(tag);
    if (closes && openedAt !== undefined) {
      spans.push([openedAt, match.index]);
      openedAt = undefined;
    }
    if (slash !== "/" && tag === "p") openedAt = match.index + 1;
  }
  if (openedAt !== undefined) spans.push([openedAt, template.length + 1]);
  return withinSpans(spans);
}
