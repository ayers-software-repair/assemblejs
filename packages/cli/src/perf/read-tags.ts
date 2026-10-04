// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const TAG = /<(link|script|assembly-root)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
const ATTRIBUTE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const NAMED: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** An attribute's value as the browser reads it, every character reference resolved. */
const decode = (value: string): string =>
  value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref.startsWith("#x") || ref.startsWith("#X"))
      return String.fromCodePoint(parseInt(ref.slice(2), 16));
    if (ref.startsWith("#")) return String.fromCodePoint(Number(ref.slice(1)));
    return NAMED[ref.toLowerCase()] ?? whole;
  });

/**
 * The link, script and envelope tags of a document, each with its attributes by lower-cased
 * name, in any order and however they are quoted, values decoded as the browser decodes them.
 */
export function readTags(
  html: string,
): readonly { readonly tag: string; readonly attributes: Readonly<Record<string, string>> }[] {
  return [...html.matchAll(TAG)].map((match) => ({
    tag: (match[1] ?? "").toLowerCase(),
    attributes: Object.fromEntries(
      [...(match[2] ?? "").matchAll(ATTRIBUTE)].map((attribute) => [
        (attribute[1] ?? "").toLowerCase(),
        decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? ""),
      ]),
    ),
  }));
}
