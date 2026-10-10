// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// What opens a stretch of markup the parser reads as text: a comment, or an element whose
// content is text up to its own end tag.
const OPENING = /<!--|<(script|style|textarea|title)\b[^>]*>/gi;

/**
 * Where markup is text the parser never reads as tags: inside a comment, and inside a script,
 * style, textarea or title element. Answers whether an offset falls in one, so a reader of tags
 * passes over what only looks like a tag.
 *
 * Read in one pass from the start, each stretch consumed whole before the next is looked for:
 * a `<script` written inside a comment opens nothing, and a `<!--` inside a script is that
 * script's text. One left open runs to the end, as the parser reads it.
 */
export function inertSpans(html: string): (at: number) => boolean {
  const spans: Array<readonly [number, number]> = [];
  let from = 0;
  for (;;) {
    OPENING.lastIndex = from;
    const opening = OPENING.exec(html);
    if (opening === null) break;
    const element = opening[1];
    let end: number;
    if (element === undefined) {
      // The closing dashes may be the opening ones: `<!-->` and `<!--->` are whole comments.
      const close = html.indexOf("-->", opening.index + 2);
      end = close === -1 ? html.length : close + 3;
    } else {
      const close = new RegExp(`</${element}\\s*>`, "i").exec(html.slice(OPENING.lastIndex));
      end = close === null ? html.length : OPENING.lastIndex + close.index + close[0].length;
    }
    spans.push([opening.index, end]);
    from = end;
  }
  return (at) => spans.some(([start, end]) => at >= start && at < end);
}
