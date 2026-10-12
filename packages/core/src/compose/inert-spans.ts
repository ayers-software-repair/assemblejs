// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { TAG_NAME_END } from "../vocab/tag-name-end.js";
import { scriptEnd } from "./script-end.js";
import { tagEnd } from "./tag-end.js";
import { withinSpans } from "./within-spans.js";

// A comment's opening, or a tag's: its slash where it is an end tag, and its name.
const OPENING = new RegExp(`<!--|<(/?)([a-zA-Z](?:(?!${TAG_NAME_END})[^])*)`, "g");
// The end tag of each of the three whose text ends at their first one, which may hold anything
// after its name. A script ends where `scriptEnd` reads it to.
const closing = (element: string): RegExp =>
  new RegExp(`</${element}(?=${TAG_NAME_END})[^>]*>`, "gi");
const CLOSING: ReadonlyMap<string, RegExp> = new Map(
  ["style", "textarea", "title"].map((element) => [element, closing(element)]),
);

/**
 * Where markup is text the parser never reads as tags: inside a comment; inside a script, style,
 * textarea or title element; and inside a tag, among its attributes, where a value may hold
 * anything a tag or a comment is written with. Answers whether an offset falls in one, so a
 * reader of tags passes over what only looks like a tag.
 *
 * Read in one pass from the start, each stretch consumed whole before the next is looked for:
 * a `<script` written inside a comment opens nothing, a `<!--` inside a script is that script's
 * text, and either inside a title attribute is the title. One left open runs to the end, as the
 * parser reads it.
 */
export function inertSpans(html: string): (at: number) => boolean {
  const spans: Array<readonly [number, number]> = [];
  let from = 0;
  for (;;) {
    OPENING.lastIndex = from;
    const opening = OPENING.exec(html);
    if (opening === null) break;
    const [, slash, name] = opening;
    if (name === undefined) {
      // The closing dashes may be the opening ones: `<!-->` and `<!--->` are whole comments.
      const close = html.indexOf("-->", opening.index + 2);
      from = close === -1 ? html.length : close + 3;
      spans.push([opening.index, from]);
      continue;
    }
    const named = OPENING.lastIndex;
    const tag = tagEnd(html, named);
    const element = slash === "" ? name.toLowerCase() : "";
    if (element === "script") {
      from = scriptEnd(html, tag);
    } else {
      const close = CLOSING.get(element);
      if (close === undefined) {
        // An ordinary tag: what it holds after its name is text, and the markup goes on after it.
        if (tag - named > 1) spans.push([named, tag]);
        from = tag;
        continue;
      }
      close.lastIndex = tag;
      from = close.exec(html) === null ? html.length : close.lastIndex;
    }
    spans.push([opening.index, from]);
  }
  return withinSpans(spans);
}
