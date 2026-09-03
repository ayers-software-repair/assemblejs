// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

// None of these is structural in JSON, so replacing them in the encoded text cannot change the
// value: "<" inside a JSON string parses back to "<". What it does change is that the text can
// no longer close the script element that carries it, and that the two line separators can no
// longer be read as line terminators by a parser that treats them that way.
//
// The two separators are written as codepoints rather than as themselves, because a character
// that is invisible in an editor is a character nobody can review.
const LINE_SEPARATOR = "\u2028";
const PARAGRAPH_SEPARATOR = "\u2029";

const AS_ESCAPE: Readonly<Record<string, string>> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LINE_SEPARATOR]: "\\u2028",
  [PARAGRAPH_SEPARATOR]: "\\u2029",
};

const UNSAFE_IN_SCRIPT = new RegExp(`[<>&${LINE_SEPARATOR}${PARAGRAPH_SEPARATOR}]`, "g");

/**
 * The one encoder for the data island. The payload is JSON by type, and this makes it safe in
 * the one position it is ever written into: inside a script element in an HTML document.
 */
export function encodeIslandJson(payload: JsonObject): string {
  return JSON.stringify(payload).replace(UNSAFE_IN_SCRIPT, (character) => {
    const escaped = AS_ESCAPE[character];
    if (escaped === undefined) throw new Error(`no escape for ${JSON.stringify(character)}`);
    return escaped;
  });
}
