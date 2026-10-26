// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@asmjs/build";
import { spreadElement } from "./spread-element.js";
import type { ViewElement } from "./view-element.js";
import type { WrittenElement } from "./written-element.js";

// The inputs a name reaches through a placeholder, by the HTML accessibility API mappings; and
// the ones named without the author: hidden is not shown, submit, reset and image take a default.
const TEXT_TYPES = new Set(["text", "password", "number", "search", "tel", "email", "url"]);
const NAMED_BY_DEFAULT = new Set(["hidden", "submit", "reset", "image"]);

const written = (value: string | true | undefined): value is string =>
  typeof value === "string" && value !== "";
const computed = (value: string | true | undefined): boolean =>
  typeof value === "string" && value.includes(COMPUTED_MARKER);
const target = (label: ViewElement) =>
  label.attributes.get("for") ?? label.attributes.get("htmlfor");

/**
 * The controls an assembly's view writes with no name the reader can find: an `input`, a
 * `select` or a `textarea` with no `aria-label`, `aria-labelledby` or `title`, no `placeholder`
 * where one names a text field, no `value` on an input of type button, no `label` for its id,
 * and no `label` that may wrap it. A label may wrap a control when it stands before it in the
 * same file without a written `for`, or in another file of the same view, where the reader
 * cannot see what it wraps. A control the view spreads onto, or whose type it computes, is left
 * to the render, as is one with a computed id while any label has a computed `for`. A `button`
 * is named by its content, which the reader does not see, so it is never judged.
 */
export function unnamedControls(elements: readonly WrittenElement[]): readonly WrittenElement[] {
  const labelled = new Set<string>();
  const wrapping = new Set<string>();
  let computedLabel = false;
  for (const { file, element } of elements) {
    if (element.tag !== "label") continue;
    const to = target(element);
    if (computed(to)) computedLabel = true;
    else if (written(to)) labelled.add(to);
    if (!written(to) || computed(to)) wrapping.add(file);
  }
  const found: WrittenElement[] = [];
  const opened = new Set<string>();
  for (const one of elements) {
    const { file, element } = one;
    const { tag, attributes } = element;
    if (tag === "label" && (!written(target(element)) || computed(target(element))))
      opened.add(file);
    if (tag !== "input" && tag !== "select" && tag !== "textarea") continue;
    const type = tag === "input" ? String(attributes.get("type") ?? "text").toLowerCase() : tag;
    if (NAMED_BY_DEFAULT.has(type) || computed(type) || spreadElement(element)) continue;
    const named =
      written(attributes.get("aria-label")) ||
      written(attributes.get("aria-labelledby")) ||
      written(attributes.get("title")) ||
      ((TEXT_TYPES.has(type) || tag === "textarea") && written(attributes.get("placeholder"))) ||
      (type === "button" && written(attributes.get("value")));
    if (named) continue;
    const id = attributes.get("id");
    if (computed(id) ? computedLabel : written(id) && labelled.has(id)) continue;
    if (opened.has(file) || [...wrapping].some((other) => other !== file)) continue;
    found.push(one);
  }
  return found;
}
