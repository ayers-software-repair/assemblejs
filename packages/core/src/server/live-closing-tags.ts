// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Text in which a closing tag is not a tag: a comment, and the contents of a script or a style.
const INERT = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>/gi;

/**
 * Where each match of a closing tag sits in a document, leaving out any inside a comment, a
 * script or a style, where it is text and not a tag.
 */
export function liveClosingTags(html: string, tag: RegExp): number[] {
  const inert = [...html.matchAll(INERT)].map(
    (match) => [match.index, match.index + match[0].length] as const,
  );
  return [...html.matchAll(tag)]
    .map((match) => match.index)
    .filter((at) => !inert.some(([from, to]) => at >= from && at < to));
}
