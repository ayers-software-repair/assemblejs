// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { TAG_NAME_END } from "../vocab/tag-name-end.js";

const NAME_END = `(?=${TAG_NAME_END})`;
// What changes how a script's text is read, in each of the three ways it is read
// (html.spec.whatwg.org, parsing, the script data states, read 2026-10-11). As written: its
// own end tag ends it, and `<!--` begins text read as escaped. Escaped: two dashes and a `>`
// end the escape, its own end tag still ends it, and a `<script` begins text read as escaped
// twice. Escaped twice: its own end tag only ends that, and the dashes end both.
const WRITTEN = new RegExp(`<!--|</script${NAME_END}`, "gi");
const ESCAPED = new RegExp(`--+>|</?script${NAME_END}`, "gi");
const ESCAPED_TWICE = new RegExp(`--+>|</script${NAME_END}`, "gi");

/**
 * Where the text of a script ends, read from just after its start tag: the offset just past
 * its end tag, or the length of the markup where it is never closed.
 *
 * A script does not always end at its first end tag. Inside `<!--`, a `<script` makes the
 * tokenizer read on past the next `</script`, which is how a page that writes a script from a
 * script was kept from ending it early. Read as ending there, what the browser still takes for
 * the script's text would be read as markup, and a placement written in it dispatched into it.
 */
export function scriptEnd(html: string, from: number): number {
  let reading = WRITTEN;
  let at = from;
  for (;;) {
    reading.lastIndex = at;
    const found = reading.exec(html);
    if (found === null) return html.length;
    const token = found[0].toLowerCase();
    at = reading.lastIndex;
    if (token === "<!--") {
      reading = ESCAPED;
      // The two dashes that began the escape may be the two that end it: `<!-->` is one whole.
      at -= 2;
    } else if (token.endsWith(">")) {
      reading = WRITTEN;
    } else if (token === "<script") {
      reading = ESCAPED_TWICE;
    } else if (reading === ESCAPED_TWICE) {
      reading = ESCAPED;
    } else {
      const close = html.indexOf(">", at);
      return close === -1 ? html.length : close + 1;
    }
  }
}
