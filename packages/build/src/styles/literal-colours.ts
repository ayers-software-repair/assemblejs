// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { NAMED_COLOURS } from "./named-colours.js";

// What a declaration's value may hold that is not a colour where it reads as one: a string and
// a url. A custom property's name needs no blanking: a word after a hyphen is no colour below.
const NOT_A_COLOUR = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|url\([^)]*\)/gi;
// A literal colour: a hex colour, one of the colour functions of CSS Color Level 4 (rgb, rgba,
// hsl, hsla, hwb, lab, lch, oklab, oklch, color) with what it holds, or a named colour.
const LITERAL =
  /#[0-9a-f]{3,8}(?![\w-])|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)|(?<![\w-])[a-z]+(?![\w-])/gi;

/**
 * The literal colours a declaration's value holds, as written: a hex colour, a colour function,
 * or a named colour, outside a string and a url, a custom property's name included. `transparent`,
 * `currentcolor` and a word that is not a colour's name are not among them.
 */
export function literalColours(value: string): readonly string[] {
  const bare = value.replace(NOT_A_COLOUR, " ");
  return [...bare.matchAll(LITERAL)]
    .map(([found]) => found)
    .filter(
      (found) =>
        found.startsWith("#") || found.includes("(") || NAMED_COLOURS.has(found.toLowerCase()),
    );
}
