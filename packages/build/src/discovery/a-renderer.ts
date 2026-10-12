// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A renderer's name with the article it is said with, for a sentence that calls an assembly by
 * what renders it: "a react", "an ejs", "an html". The names are said as written, and the two
 * that begin with a vowel's sound are the two that take "an".
 */
export function aRenderer(name: string): string {
  return `${/^(?:[aeiou]|html$)/i.test(name) ? "an" : "a"} ${name}`;
}
