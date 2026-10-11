// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { inertSpans } from "@assemblejs/core";
import { COMPUTED_MARKER } from "./computed-marker.js";
import type { ViewElement } from "./view-element.js";

// A start tag: its name, then its attributes as far as the next `>`, a self-closing slash allowed.
const START_TAG =
  /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>=]+))?)*)\s*\/?>/g;
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>=]+)))?/g;
// The elements whose content the parser reads as text: their own start tag is still a tag; and
// what ends such a span, or a comment, right before a tag that opens the next.
const RAW_TEXT_OPENER = /^<(?:script|style|textarea|title)\b/i;
const SPAN_END = /(?:<\/(?:script|style|textarea|title)\s*>|-->)$/i;

/**
 * Every element markup writes, in order, with its attributes: each start tag outside a comment
 * and outside a script, style, textarea or title, which the parser reads as text. Names are
 * lower-cased, as the parser reads them; a value is unquoted; an attribute written bare is
 * `true`. A tag that holds the template's marker anywhere is read as computed. The start tag of
 * a script, style, textarea or title is read, as the parser reads it; what it holds is not.
 */
export function readElements(markup: string): readonly ViewElement[] {
  const inert = inertSpans(markup);
  const found: ViewElement[] = [];
  START_TAG.lastIndex = 0;
  for (const match of markup.matchAll(START_TAG)) {
    const [whole, tag = "", written = ""] = match;
    // Inside a span the parser reads as text, unless this tag opens one: its own start, or the
    // one right after another span ends, which the spans' own ends do not tell apart.
    const opens =
      RAW_TEXT_OPENER.test(whole) &&
      (match.index === 0 || !inert(match.index - 1) || SPAN_END.test(markup.slice(0, match.index)));
    if (inert(match.index) && !opens) continue;
    const attributes = new Map<string, string | true>();
    ATTRIBUTE.lastIndex = 0;
    for (const attribute of written.matchAll(ATTRIBUTE)) {
      const [, name = "", double, single, bare] = attribute;
      const value = double ?? single ?? bare;
      if (!attributes.has(name.toLowerCase())) {
        attributes.set(name.toLowerCase(), value === undefined ? true : value);
      }
    }
    found.push({
      tag: tag.toLowerCase(),
      attributes,
      at: match.index,
      computed: whole.includes(COMPUTED_MARKER),
    });
  }
  return found;
}
