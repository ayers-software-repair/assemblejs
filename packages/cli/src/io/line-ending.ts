// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * How a file ends its lines, read off the first one it ends: a carriage return and a line feed,
 * or a line feed alone, which is also the answer for a file of one line. What a command writes
 * into a file it did not make is written with that file's ending, so a checkout that ends its
 * lines one way is never handed a file that ends them two.
 */
export function lineEnding(text: string): "\n" | "\r\n" {
  const feed = text.indexOf("\n");
  return feed > 0 && text[feed - 1] === "\r" ? "\r\n" : "\n";
}
