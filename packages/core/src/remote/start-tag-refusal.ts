// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { OpenElements } from "./open-elements.js";

// Elements whose start tag closes an open element of its kind further up unless its own
// container is open directly around it: an `<li>` with no list of its own closes the page's.
// A map, because the name asked of it is whatever the answer wrote.
const CONTAINER: ReadonlyMap<string, readonly string[]> = new Map(
  Object.entries({
    li: ["ul", "ol", "menu"],
    dd: ["dl"],
    dt: ["dl"],
    td: ["tr"],
    th: ["tr"],
    tr: ["tbody", "thead", "tfoot", "table"],
    tbody: ["table"],
    thead: ["table"],
    tfoot: ["table"],
    caption: ["table"],
    colgroup: ["table"],
    col: ["colgroup", "table"],
    rb: ["ruby"],
    rtc: ["ruby"],
    rt: ["ruby", "rtc"],
    rp: ["ruby", "rtc"],
  }),
);
// Start tags that close an open `<p>` first.
const CLOSES_P = new Set(
  (
    "address article aside blockquote center details dialog dir div dl fieldset figcaption " +
    "figure footer header hgroup main menu nav ol p search section summary ul h1 h2 h3 h4 h5 " +
    "h6 pre listing form li dd dt table hr"
  ).split(" "),
);
const HEADING = /^h[1-6]$/;
const TABLE_CONTEXT = new Set(["table", "tbody", "thead", "tfoot", "tr"]);
const IN_SELECT = new Set(["option", "optgroup", "hr"]);
// Elements that close an open one of their own kind wherever it is.
const ONE_AT_A_TIME = new Set(["a", "button", "nobr", "form", "select"]);

/**
 * Why a start tag, read inside the elements that are open, would make the browser close an
 * element on its own, or undefined when it would not. A close the fragment did not write leaves
 * its own end tags matching elements further up, in the page, which is how a fragment escapes
 * its envelope; so each such tag is refused rather than followed.
 */
export function startTagRefusal(name: string, open: OpenElements): string | undefined {
  const parent = open.innermost?.name ?? "";
  const container = CONTAINER.get(name);
  if (container !== undefined && !container.includes(parent)) {
    return `a <${name}> outside its own container`;
  }
  if (open.holds("select") && !IN_SELECT.has(name)) return `a <${name}> inside a <select>`;
  if (ONE_AT_A_TIME.has(name) && open.holds(name)) return `a <${name}> inside a <${name}>`;
  if (CLOSES_P.has(name) && open.paragraph) return `a <${name}> inside an open <p>`;
  if (HEADING.test(name) && HEADING.test(parent)) return `a <${name}> inside a <${parent}>`;
  if (name === "option" && parent === "option") return "an <option> inside an <option>";
  if (name === "optgroup" && (parent === "option" || parent === "optgroup")) {
    return `an <optgroup> inside an <${parent}>`;
  }
  if (name === "table" && TABLE_CONTEXT.has(parent)) return `a <table> directly in a <${parent}>`;
  return undefined;
}
