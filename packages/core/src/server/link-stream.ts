// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { escapeAttribute } from "../encode/escape-attribute.js";
import { STREAM_META_NAME } from "../vocab/stream-meta-name.js";
import { liveClosingTags } from "./live-closing-tags.js";

const HEAD_CLOSE = /<\/head\s*>/gi;

/**
 * Names a page's stream in its document, as a meta element at the end of the head, which the
 * page's runtime reads to open its one connection. A page with no stream is left as it is; a
 * template without a head gets the element first.
 */
export function linkStream(html: string, stream: string | undefined): string {
  if (stream === undefined) return html;
  const meta = `<meta name="${STREAM_META_NAME}" content="${escapeAttribute(stream)}">`;
  const head = liveClosingTags(html, HEAD_CLOSE)[0];
  return head === undefined ? meta + html : html.slice(0, head) + meta + html.slice(head);
}
