// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import { readStartTag } from "./read-start-tag.js";
import type { ScannedTag } from "./scanned-tag.js";
import { startTagRefusal } from "./start-tag-refusal.js";

const VOID = new Set(
  "area base br col embed hr img input keygen link meta param source track wbr".split(" "),
);
// Elements whose content is text up to their own end tag, in HTML content.
const RAW_TEXT = new Set(["script", "style", "textarea", "title"]);
// Elements that act on the page around the fragment, or whose content the browser reads in a way
// this does not follow. None belongs in an assembly's markup.
const REFUSED = new Set(
  "html head body frameset frame plaintext xmp iframe noembed noframes noscript image".split(" "),
);
const FOREIGN = new Set(["svg", "math"]);
// Inside SVG or MathML these hand content back to HTML.
const INTEGRATION = new Set(["foreignobject", "desc", "title", "mi", "mo", "mn", "ms", "mtext"]);
// MathML's text integration points, inside which these two stay MathML rather than HTML.
const MATH_TEXT = new Set(["mi", "mo", "mn", "ms", "mtext"]);
const STAY_MATH = new Set(["mglyph", "malignmark"]);

/**
 * Reads a remote's answer as the browser will, and answers every HTML start tag in it, in order,
 * or why the answer is refused.
 *
 * An answer is one envelope and nothing around it, every element inside closed by its own end
 * tag in order. That is what keeps the fragment where the page put it: an end tag with no start
 * tag in the fragment, a comment or a raw-text element read differently from the browser, or an
 * element that closes its kind further up would carry the rest of the answer out of the envelope
 * and into the page. Anything this cannot read exactly as the browser does is refused, not
 * guessed at; what renderers emit is well inside what it reads.
 */
export function scanFragment(html: string): readonly ScannedTag[] | string {
  const tags: ScannedTag[] = [];
  const open: Array<{ readonly name: string; readonly foreign: boolean }> = [];
  let closed = false;
  let i = 0;
  while (i < html.length) {
    const next = html.indexOf("<", i);
    const text = html.slice(i, next === -1 ? html.length : next);
    if (open.length === 0 && text.trim() !== "") return "content outside the envelope";
    if (next === -1) break;
    i = next;
    const top = open.at(-1);
    const foreign = top !== undefined && top.foreign && !INTEGRATION.has(top.name);
    // Whether a start tag here would still be MathML: anything in foreign content, and mglyph or
    // malignmark directly in a text integration point, whose content the browser then reads as
    // markup, never as the raw text the same tag would hold in HTML.
    const staysForeign = (name: string): boolean =>
      foreign ||
      (top !== undefined && top.foreign && MATH_TEXT.has(top.name) && STAY_MATH.has(name));

    if (html.startsWith("<!--", i)) {
      if (open.length === 0) return "content outside the envelope";
      if (html.startsWith("<!-->", i) || html.startsWith("<!--->", i)) return "an empty comment";
      const end = html.indexOf("-->", i + 4);
      if (end === -1) return "an unclosed comment";
      if (html.slice(i + 4, end).includes("--!")) return "a comment the browser ends early";
      i = end + 3;
      continue;
    }
    if (html.startsWith("</", i)) {
      const found = /^<\/([a-zA-Z][^\t\n\f\r />]*)[\t\n\f\r ]*>/.exec(html.slice(i));
      if (found === null) return "an end tag the browser reads differently";
      const name = (found[1] ?? "").toLowerCase();
      if (top?.name !== name) return `an end tag </${name}> with no open <${name}> to close`;
      open.pop();
      i += found[0].length;
      if (open.length === 0) closed = true;
      continue;
    }
    if (!/^<[a-zA-Z]/.test(html.slice(i, i + 2))) {
      if (html.startsWith("<!", i) || html.startsWith("<?", i)) return "markup the browser ignores";
      if (open.length === 0) return "content outside the envelope";
      i += 1;
      continue;
    }

    const tag = readStartTag(html, i);
    if (typeof tag === "string") return tag;
    i = tag.end;
    if (open.length === 0 && (closed || tag.name !== ENVELOPE_ELEMENT)) {
      return closed ? "more than one envelope" : "an answer that does not start with an envelope";
    }
    if (REFUSED.has(tag.name)) return `a <${tag.name}> element`;
    if (staysForeign(tag.name)) {
      if (/^[a-z]+$/.test(tag.name) && BREAKOUT.has(tag.name)) {
        return `a <${tag.name}> inside SVG or MathML`;
      }
      if (tag.name === ENVELOPE_ELEMENT) return "an envelope inside SVG or MathML";
      if (!tag.selfClosing) open.push({ name: tag.name, foreign: true });
      continue;
    }
    const refusal = startTagRefusal(
      tag.name,
      open.map((element) => element.name),
    );
    if (refusal !== undefined) return refusal;
    tags.push(tag);
    if (VOID.has(tag.name)) continue;
    if (RAW_TEXT.has(tag.name)) {
      const end = new RegExp(`</${tag.name}[\\t\\n\\f\\r />]`, "i").exec(html.slice(i));
      if (end === null) return `an unclosed <${tag.name}>`;
      const body = html.slice(i, i + end.index);
      if (tag.name === "script" && body.includes("<!--")) return "a comment inside a script";
      i += end.index;
      open.push({ name: tag.name, foreign: false });
      continue;
    }
    // A self-closed <svg/> or <math/> is closed at once; any other HTML element is not.
    if (FOREIGN.has(tag.name) && tag.selfClosing) continue;
    open.push({ name: tag.name, foreign: FOREIGN.has(tag.name) });
  }
  if (open.length > 0) return `an unclosed <${open.at(-1)?.name ?? ""}>`;
  if (!closed) return "no envelope";
  return tags;
}

// HTML start tags that end SVG or MathML content wherever they appear inside it.
const BREAKOUT = new Set(
  (
    "b big blockquote body br center code dd div dl dt em embed font h1 h2 h3 h4 h5 h6 head hr i " +
    "img li listing menu meta nobr ol p pre ruby s small span strong strike sub sup table tt u " +
    "ul var"
  ).split(" "),
);
