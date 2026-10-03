// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const FORM_TAG = /<(\/?)form(?=[\s/>])/gi;
const COMMENT = /<!--[\s\S]*?-->/g;

/**
 * Whether a position in a page template lies inside a `<form>` the template opened. A page's
 * template is its author's own markup, so its form tags are read as written, comments aside.
 */
export function insideForm(template: string, at: number): boolean {
  const comments = [...template.matchAll(COMMENT)].map(
    (comment) => [comment.index, comment.index + comment[0].length] as const,
  );
  let depth = 0;
  for (const tag of template.matchAll(FORM_TAG)) {
    if (tag.index >= at) break;
    if (comments.some(([from, to]) => tag.index >= from && tag.index < to)) continue;
    depth = tag[1] === "/" ? Math.max(0, depth - 1) : depth + 1;
  }
  return depth > 0;
}
