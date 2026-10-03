// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { liveClosingTags } from "./live-closing-tags.js";

const HEAD_CLOSE = /<\/head\s*>/gi;
// A doctype, after any whitespace and comments a template opens with.
const DOCTYPE = /^(?:\s|<!--[\s\S]*?-->)*<!doctype[^>]*>/i;

/**
 * Where something that belongs in a document's head goes: before its first closing head tag, or,
 * in a template with none, after its doctype, as anything before the doctype puts the browser in
 * quirks mode; at the very start when there is neither.
 */
export function headEnd(html: string): number {
  return liveClosingTags(html, HEAD_CLOSE)[0] ?? DOCTYPE.exec(html)?.[0].length ?? 0;
}
