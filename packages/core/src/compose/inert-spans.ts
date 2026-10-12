// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { withinSpans } from "./within-spans.js";

// Where a tag's name ends, as the tokenizer reads it: at a space, a slash or the tag's own end.
// `<title-bar>` is an element named title-bar, and opens nothing a `<title>` would.
const NAME_END = "(?=[\\t\\n\\f\\r />])";
// What opens a stretch of markup the parser reads as text: a comment, or an element whose
// content is text up to its own end tag.
const OPENING = new RegExp(`<!--|<(script|style|textarea|title)${NAME_END}[^>]*>`, "gi");
// The end tag of each, which may hold anything after its name.
const closing = (element: string): RegExp => new RegExp(`</${element}${NAME_END}[^>]*>`, "gi");
const CLOSING: Readonly<Record<string, RegExp>> = {
  script: closing("script"),
  style: closing("style"),
  textarea: closing("textarea"),
  title: closing("title"),
};

/**
 * Where markup is text the parser never reads as tags: inside a comment, and inside a script,
 * style, textarea or title element. Answers whether an offset falls in one, so a reader of tags
 * passes over what only looks like a tag.
 *
 * Read in one pass from the start, each stretch consumed whole before the next is looked for:
 * a `<script` written inside a comment opens nothing, and a `<!--` inside a script is that
 * script's text. One left open runs to the end, as the parser reads it. A script ends at its
 * first end tag.
 */
export function inertSpans(html: string): (at: number) => boolean {
  const spans: Array<readonly [number, number]> = [];
  let from = 0;
  for (;;) {
    OPENING.lastIndex = from;
    const opening = OPENING.exec(html);
    if (opening === null) break;
    const element = opening[1]?.toLowerCase();
    let end: number;
    if (element === undefined) {
      // The closing dashes may be the opening ones: `<!-->` and `<!--->` are whole comments.
      const close = html.indexOf("-->", opening.index + 2);
      end = close === -1 ? html.length : close + 3;
    } else {
      const close = CLOSING[element];
      if (close === undefined) break;
      close.lastIndex = OPENING.lastIndex;
      end = close.exec(html) === null ? html.length : close.lastIndex;
    }
    spans.push([opening.index, end]);
    from = end;
  }
  return withinSpans(spans);
}
