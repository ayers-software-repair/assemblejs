// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import { OpenElements } from "./open-elements.js";
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
// Where SVG and MathML hand content back to HTML: an element of that name in that one of the
// two, and in the other an element like any other (html.spec.whatwg.org, parsing, "HTML
// integration point" and "MathML text integration point", read 2026-10-11). MathML's sixth,
// annotation-xml, is one or is not by the decoded value of an attribute, so it is refused
// where it would be MathML rather than read.
const INTEGRATION = {
  svg: new Set(["foreignobject", "desc", "title"]),
  math: new Set(["mi", "mo", "mn", "ms", "mtext"]),
} as const;
// Directly inside one of MathML's, these two stay MathML rather than HTML.
const STAY_MATH = new Set(["mglyph", "malignmark"]);
// An end tag, read from where it stands.
const END_TAG = /<\/([a-zA-Z][^\t\n\f\r />]*)[\t\n\f\r ]*>/y;
// Where the text of each raw-text element ends: at the start of its own end tag.
const rawEnd = (name: string): RegExp => new RegExp(`</${name}[\\t\\n\\f\\r />]`, "gi");
const RAW_END: ReadonlyMap<string, RegExp> = new Map(
  [...RAW_TEXT].map((name) => [name, rawEnd(name)]),
);

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
  const open = new OpenElements();
  let closed = false;
  let i = 0;
  while (i < html.length) {
    const next = html.indexOf("<", i);
    const text = html.slice(i, next === -1 ? html.length : next);
    if (open.depth === 0 && text.trim() !== "") return "content outside the envelope";
    if (next === -1) break;
    i = next;
    const top = open.innermost;
    // Which of SVG and MathML a start tag here would be, when it would not be HTML: its
    // parent's, anywhere in either that does not hand content back; and MathML for mglyph or
    // malignmark directly in one of MathML's that does, whose content the browser then reads as
    // markup, never as the raw text the same tag would hold in HTML.
    const outsideHtml = (name: string): "svg" | "math" | undefined => {
      if (top === undefined || top.kind === "html") return undefined;
      if (!INTEGRATION[top.kind].has(top.name)) return top.kind;
      return top.kind === "math" && STAY_MATH.has(name) ? "math" : undefined;
    };

    if (html.startsWith("<!--", i)) {
      if (open.depth === 0) return "content outside the envelope";
      if (html.startsWith("<!-->", i) || html.startsWith("<!--->", i)) return "an empty comment";
      const end = html.indexOf("-->", i + 4);
      if (end === -1) return "an unclosed comment";
      if (html.slice(i + 4, end).includes("--!")) return "a comment the browser ends early";
      i = end + 3;
      continue;
    }
    if (html.startsWith("</", i)) {
      END_TAG.lastIndex = i;
      const found = END_TAG.exec(html);
      if (found === null) return "an end tag the browser reads differently";
      const name = (found[1] ?? "").toLowerCase();
      if (top?.name !== name) return `an end tag </${name}> with no open <${name}> to close`;
      open.close();
      i += found[0].length;
      if (open.depth === 0) closed = true;
      continue;
    }
    if (!/^<[a-zA-Z]/.test(html.slice(i, i + 2))) {
      if (html.startsWith("<!", i) || html.startsWith("<?", i)) return "markup the browser ignores";
      if (open.depth === 0) return "content outside the envelope";
      i += 1;
      continue;
    }

    const tag = readStartTag(html, i);
    if (typeof tag === "string") return tag;
    i = tag.end;
    if (open.depth === 0 && (closed || tag.name !== ENVELOPE_ELEMENT)) {
      return closed ? "more than one envelope" : "an answer that does not start with an envelope";
    }
    if (REFUSED.has(tag.name)) return `a <${tag.name}> element`;
    const kind = outsideHtml(tag.name);
    if (kind !== undefined) {
      if (BREAKOUT.has(tag.name)) return `a <${tag.name}> inside SVG or MathML`;
      if (tag.name === ENVELOPE_ELEMENT) return "an envelope inside SVG or MathML";
      if (kind === "math" && tag.name === "annotation-xml") {
        return "an <annotation-xml> inside MathML";
      }
      if (!tag.selfClosing) open.open(tag.name, kind);
      continue;
    }
    const refusal = startTagRefusal(tag.name, open);
    if (refusal !== undefined) return refusal;
    tags.push(tag);
    if (VOID.has(tag.name)) continue;
    const rawTextEnd = RAW_END.get(tag.name);
    if (rawTextEnd !== undefined) {
      rawTextEnd.lastIndex = i;
      const end = rawTextEnd.exec(html);
      if (end === null) return `an unclosed <${tag.name}>`;
      const body = html.slice(i, end.index);
      if (tag.name === "script" && body.includes("<!--")) return "a comment inside a script";
      i = end.index;
      open.open(tag.name, "html");
      continue;
    }
    const root = tag.name === "svg" ? "svg" : tag.name === "math" ? "math" : undefined;
    // A self-closed <svg/> or <math/> is closed at once; any other HTML element is not.
    if (root !== undefined && tag.selfClosing) continue;
    open.open(tag.name, root ?? "html");
  }
  if (open.depth > 0) return `an unclosed <${open.innermost?.name ?? ""}>`;
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
