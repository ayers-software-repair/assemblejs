// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { escapeAttribute } from "../encode/escape-attribute.js";
import { EVENTS_META_NAME } from "../vocab/events-meta-name.js";
import { headEnd } from "./head-end.js";

/**
 * Names, in a page's document, the remote servers whose runtimes join the page's bus, as a meta
 * element at the end of the head. A page that admits none is left as it is.
 */
export function linkEvents(html: string, origins: readonly string[]): string {
  if (origins.length === 0) return html;
  const meta = `<meta name="${EVENTS_META_NAME}" content="${escapeAttribute(origins.join(" "))}">`;
  const at = headEnd(html);
  return html.slice(0, at) + meta + html.slice(at);
}
