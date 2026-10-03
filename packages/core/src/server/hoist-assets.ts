// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import { escapeAttribute } from "../encode/escape-attribute.js";

const HEAD_CLOSE = /<\/head\s*>/i;
const BODY_CLOSE = /<\/body\s*>(?![\s\S]*<\/body\s*>)/i;

/**
 * Links a page's browser files into its document: stylesheets at the end of the head, modules
 * at the end of the body, each url once.
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
    const head = HEAD_CLOSE.exec(out);
    out = head === null ? css + out : out.slice(0, head.index) + css + out.slice(head.index);
  }
  if (js !== "") {
    const body = BODY_CLOSE.exec(out);
    out = body === null ? out + js : out.slice(0, body.index) + js + out.slice(body.index);
  }
  return out;
}
