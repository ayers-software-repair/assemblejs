// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ScannedAttribute } from "./scanned-attribute.js";
import type { ScannedTag } from "./scanned-tag.js";

const SPACE = /[\t\n\f\r ]/;
const NAME_END = /[\t\n\f\r />]/;
const ATTRIBUTE_NAME_END = /[\t\n\f\r />=]/;
const UNQUOTED_END = /[\t\n\f\r >]/;
// Characters the browser accepts in these places with a parse error. Each is a place where a
// reader and the browser can disagree, so a tag that uses one is refused rather than guessed.
const AMBIGUOUS_NAME = /["'<=`]/;
const AMBIGUOUS_UNQUOTED = /["'<=`]/;

/**
 * Reads the start tag whose `<` is at `at`, the way the browser's tokenizer does, or answers why
 * it will not: a tag cut off by the end of the answer, or one written in a way the browser only
 * accepts as an error, where what this reads and what the browser builds could differ.
 */
export function readStartTag(html: string, at: number): ScannedTag | string {
  let i = at + 1;
  while (i < html.length && !NAME_END.test(html.charAt(i))) i += 1;
  const name = html.slice(at + 1, i).toLowerCase();
  if (AMBIGUOUS_NAME.test(name)) return `the tag name "${name}" is ambiguous`;
  const attributes: ScannedAttribute[] = [];
  for (;;) {
    while (i < html.length && SPACE.test(html.charAt(i))) i += 1;
    if (i >= html.length) return `the <${name}> tag is not closed`;
    const char = html.charAt(i);
    if (char === ">") return { name, start: at, end: i + 1, attributes, selfClosing: false };
    if (char === "/") {
      if (html.charAt(i + 1) === ">") {
        return { name, start: at, end: i + 2, attributes, selfClosing: true };
      }
      return `a "/" inside the <${name}> tag`;
    }
    const from = i;
    while (i < html.length && !ATTRIBUTE_NAME_END.test(html.charAt(i))) i += 1;
    const attribute = html.slice(from, i).toLowerCase();
    if (attribute === "" || AMBIGUOUS_NAME.test(attribute)) {
      return `an ambiguous attribute name in the <${name}> tag`;
    }
    let after = i;
    while (after < html.length && SPACE.test(html.charAt(after))) after += 1;
    if (html.charAt(after) === "=") {
      i = after + 1;
      while (i < html.length && SPACE.test(html.charAt(i))) i += 1;
      const quote = html.charAt(i);
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, i + 1);
        if (close === -1) return `an unclosed attribute value in the <${name}> tag`;
        i = close + 1;
      } else {
        const valueFrom = i;
        while (i < html.length && !UNQUOTED_END.test(html.charAt(i))) i += 1;
        if (i === valueFrom || AMBIGUOUS_UNQUOTED.test(html.slice(valueFrom, i))) {
          return `an ambiguous attribute value in the <${name}> tag`;
        }
      }
    }
    attributes.push({ name: attribute, source: html.slice(from, i) });
  }
}
