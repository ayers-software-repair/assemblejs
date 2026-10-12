// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { inertSpans } from "../compose/inert-spans.js";

/**
 * Where each match of a closing tag sits in a document, leaving out any inside a comment or an
 * element whose content is text, where it is text and not a tag.
 */
export function liveClosingTags(html: string, tag: RegExp): number[] {
  const inert = inertSpans(html);
  return [...html.matchAll(tag)].map((match) => match.index).filter((at) => !inert(at));
}
