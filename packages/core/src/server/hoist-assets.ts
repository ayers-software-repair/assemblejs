// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import { escapeAttribute } from "../encode/escape-attribute.js";
import { liveClosingTags } from "./live-closing-tags.js";

const HEAD_CLOSE = /<\/head\s*>/gi;
const BODY_CLOSE = /<\/body\s*>/gi;
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
    const head = liveClosingTags(out, HEAD_CLOSE)[0];
    out = head === undefined ? css + out : out.slice(0, head) + css + out.slice(head);
  }
  if (js !== "") {
    const body = liveClosingTags(out, BODY_CLOSE).at(-1);
    out = body === undefined ? out + js : out.slice(0, body) + js + out.slice(body);
  }
  return out;
}
