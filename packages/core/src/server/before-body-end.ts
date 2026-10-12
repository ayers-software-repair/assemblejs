// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { liveClosingTags } from "./live-closing-tags.js";

const BODY_CLOSE = /<\/body\s*>/gi;

/**
 * A document with markup added where its body ends: before the last closing tag of a body that
 * a browser would read as one, or last of all in a template that closes none, because the
 * template is the author's whole document and what a page needs is not lost for want of a tag.
 */
export function beforeBodyEnd(html: string, markup: string): string {
  if (markup === "") return html;
  const body = liveClosingTags(html, BODY_CLOSE).at(-1);
  return body === undefined ? html + markup : html.slice(0, body) + markup + html.slice(body);
}
