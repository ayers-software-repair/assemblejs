// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import { escapeAttribute } from "../encode/escape-attribute.js";

const HEAD_CLOSE = /<\/head\s*>/gi;
const BODY_CLOSE = /<\/body\s*>/gi;
// Text in which a closing tag is not a tag: a comment, and the contents of a script or a style.
const INERT = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>/gi;

const inertRanges = (html: string): Array<readonly [number, number]> =>
  [...html.matchAll(INERT)].map((match) => [match.index, match.index + match[0].length] as const);

/** Where each match of a closing tag is, leaving out any that sits in inert text. */
const live = (html: string, tag: RegExp): number[] => {
  const ranges = inertRanges(html);
  return [...html.matchAll(tag)]
    .map((match) => match.index)
    .filter((at) => !ranges.some(([from, to]) => at >= from && at < to));
};

/**
 * Links a page's browser files into its document: stylesheets at the end of the head, modules
 * at the end of the body, each url once. A closing tag inside a comment, a script or a style is
 * text, not a tag, and is passed over.
 *
 * A template without a head gets its stylesheets first and one without a body gets its modules
 * last, because the template is the author's whole document and a page that loses its assets
 * for want of a tag is a page that renders unstyled and inert with nothing saying why.
 */
export function hoistAssets(html: string, assets: AssemblyAssets): string {
  const css = [...new Set(assets.css)]
    .map((href) => `<link rel="stylesheet" href="${escapeAttribute(href)}">`)
    .join("");
  const js = [...new Set(assets.js)]
    .map((src) => `<script type="module" src="${escapeAttribute(src)}"></script>`)
    .join("");

  let out = html;
  if (css !== "") {
    const head = live(out, HEAD_CLOSE)[0];
    out = head === undefined ? css + out : out.slice(0, head) + css + out.slice(head);
  }
  if (js !== "") {
    const body = live(out, BODY_CLOSE).at(-1);
    out = body === undefined ? out + js : out.slice(0, body) + js + out.slice(body);
  }
  return out;
}
