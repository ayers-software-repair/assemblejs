// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// A name ends where its tag's attributes or end begin, so `<script-loader>` is not a script.
const TAG = /<(link|script|assembly-root)(?=[\s/>])((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
const ATTRIBUTE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
// A comment (`<!-->` and `<!--->` end at once, as in a browser), or the opening tag of an element
// whose content loads nothing and everything up to its end, whichever starts first: raw text
// (script, style, textarea, title), what a browser with scripting on parses as text (noscript),
// and a template's inert content, unless it declares a shadow root. A tag written inside any of them is never an element.
const TEXT =
  /<!--(?:-?>|[\s\S]*?(?:-->|$))|(<(script|style|textarea|title|noscript|template)(?=[\s/>])(?:[^>"']|"[^"]*"|'[^']*')*>)[\s\S]*?(?:<\/\2\s*>|$)/gi;
const NAMED: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

// A numeric reference the browser does not turn into its character, it turns into U+FFFD.
const REPLACEMENT = 0xfffd;
const codePoint = (value: number): string =>
  String.fromCodePoint(
    value === 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff) ? REPLACEMENT : value,
  );

/**
 * An attribute's value as the browser reads it: every numeric reference resolved, and the named
 * ones markup escapes with. Any other named reference is left as written, which no url this
 * framework writes contains.
 */
const decode = (value: string): string =>
  value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref.startsWith("#x") || ref.startsWith("#X")) return codePoint(parseInt(ref.slice(2), 16));
    if (ref.startsWith("#")) return codePoint(Number(ref.slice(1)));
    return NAMED[ref.toLowerCase()] ?? whole;
  });

/**
 * The link, script and envelope tags of a document, each with its attributes by lower-cased
 * name, in any order and however they are quoted, values decoded. A tag inside a comment or
 * inside a script's text is not one.
 */
export function readTags(
  html: string,
): readonly { readonly tag: string; readonly attributes: Readonly<Record<string, string>> }[] {
  // A template that declares a shadow root is not inert: the browser attaches its content, the
  // stylesheets a shadow assembly links among it.
  const elements = html.replace(TEXT, (whole: string, open: string | undefined, name?: string) =>
    open === undefined
      ? ""
      : name?.toLowerCase() === "template" && /\sshadowrootmode\s*=/i.test(open)
        ? whole
        : open,
  );
  return [...elements.matchAll(TAG)].map((match) => ({
    tag: (match[1] ?? "").toLowerCase(),
    attributes: Object.fromEntries(
      [...(match[2] ?? "").matchAll(ATTRIBUTE)].map((attribute) => [
        (attribute[1] ?? "").toLowerCase(),
        decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? ""),
      ]),
    ),
  }));
}
