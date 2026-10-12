// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const SPACE = /[\t\n\f\r ]/;
// What ends an attribute's name, and what ends a value written without quotes.
const NAME_STOP = /[\t\n\f\r />=]/;
const VALUE_STOP = /[\t\n\f\r >]/;

/**
 * Where a tag ends, read from just past its name: the offset just past the `>` that closes it,
 * or the length of the markup where nothing does.
 *
 * Read as the tokenizer reads a tag's attributes (html.spec.whatwg.org, parsing, "Before
 * attribute name state" to "Self-closing start tag state", read 2026-10-11). A `>` inside a
 * quoted value is the value's text, and a quote opens a value only after an `=`: anywhere else
 * it is part of a name or of a value written without quotes, which ends at white space or `>`.
 * A reader that took the first `>` for the tag's end, or every quote for a value's, would read
 * the rest of the tag as markup or the markup after it as the tag.
 */
export function tagEnd(html: string, from: number): number {
  const length = html.length;
  let at = from;
  for (;;) {
    // Before a name: white space, and a slash that does not close the tag, are passed over.
    while (at < length && (SPACE.test(html.charAt(at)) || html.charAt(at) === "/")) at += 1;
    if (at >= length) return length;
    if (html.charAt(at) === ">") return at + 1;
    // A name, whose first character is its own whatever it is.
    at += 1;
    while (at < length && !NAME_STOP.test(html.charAt(at))) at += 1;
    while (at < length && SPACE.test(html.charAt(at))) at += 1;
    if (html.charAt(at) !== "=") continue;
    at += 1;
    while (at < length && SPACE.test(html.charAt(at))) at += 1;
    const opening = html.charAt(at);
    if (opening === '"' || opening === "'") {
      const closing = html.indexOf(opening, at + 1);
      if (closing === -1) return length;
      at = closing + 1;
    } else {
      while (at < length && !VALUE_STOP.test(html.charAt(at))) at += 1;
    }
  }
}
