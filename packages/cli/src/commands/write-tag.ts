// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { BYTE_ORDER_MARK } from "@asmjs/build";
import { lineEnding } from "@asmjs/build";

/** Where the line that holds an offset begins: after a byte order mark, in a file's first. */
const lineStart = (text: string, at: number): number => {
  const start = at === 0 ? 0 : text.lastIndexOf("\n", at - 1) + 1;
  return start === 0 && text.startsWith(BYTE_ORDER_MARK) ? BYTE_ORDER_MARK.length : start;
};
/** Where it ends: before its line ending, or with the file. */
const lineEnd = (text: string, at: number): number => {
  const feed = text.indexOf("\n", at);
  if (feed === -1) return text.length;
  return feed > at && text[feed - 1] === "\r" ? feed - 1 : feed;
};
/** One step of a file's indentation: the least any of its lines is indented by. */
const step = (text: string): string =>
  [...text.matchAll(/^[ \t]+(?=\S)/gm)]
    .map(([indent]) => indent)
    .sort((one, other) => one.length - other.length)[0] ?? "";

/**
 * A template with a tag written into it at an offset, laid out as the file is. Where nothing
 * but whitespace follows the offset on its line, the tag is a new line beneath it; where nothing
 * but whitespace comes before, a new line above; and anywhere else it is written where it was
 * asked for, with no whitespace added, because what shares a line may be inline text, where
 * whitespace shows.
 *
 * A line it writes is indented as the line holding `like` is, one step of the file's own
 * further for `deeper`, which is how a first child is laid under the element that holds it;
 * and it ends as the file ends its lines. A template that holds nothing becomes the tag.
 */
export function writeTag(
  template: string,
  tag: string,
  at: number,
  like = at,
  deeper = false,
): string {
  const ending = lineEnding(template);
  if (template.trim() === "") {
    return `${template.startsWith(BYTE_ORDER_MARK) ? BYTE_ORDER_MARK : ""}${tag}${ending}`;
  }
  const from = lineStart(template, like);
  const indent = `${/^[ \t]*/.exec(template.slice(from))?.[0] ?? ""}${deeper ? step(template) : ""}`;
  const put = (where: number, text: string): string =>
    `${template.slice(0, where)}${text}${template.slice(where)}`;
  const above = lineStart(template, at);
  const beneath = lineEnd(template, at);
  if (template.slice(at, beneath).trim() === "") return put(beneath, `${ending}${indent}${tag}`);
  if (template.slice(above, at).trim() === "") return put(above, `${indent}${tag}${ending}`);
  return put(at, tag);
}
