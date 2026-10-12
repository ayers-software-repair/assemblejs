// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@assemblejs/build";
import { readElements } from "./read-elements.js";
import type { ViewElement } from "./view-element.js";

const SCRIPT_OR_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
// One brace expression with no brace inside; nested ones are taken from the inside out.
const EXPRESSION = /\{[^{}]*\}/g;

/**
 * The elements a Svelte component's markup writes, read from its source as text: everything
 * outside its script and style, with every `{ }` expression standing as the marker, from the
 * inside out where they nest, so a block (`{#if}`, `{:else}`, `{/if}`) is text between tags
 * and an attribute written `alt={value}` is the attribute with the marker for its value, which
 * makes the element computed. A spread `{...rest}` stands as the marker too, an attribute named
 * by it, and the element it is on is computed, since what it holds is only a render's to know.
 */
export function svelteElements(source: string): readonly ViewElement[] {
  let markup = source.replace(SCRIPT_OR_STYLE, "");
  for (;;) {
    const masked = markup.replace(EXPRESSION, COMPUTED_MARKER);
    if (masked === markup) break;
    markup = masked;
  }
  return readElements(markup).map((element) => {
    const attributes = new Map<string, string | true>();
    let computed = element.computed;
    for (const [name, value] of element.attributes) {
      if (name === COMPUTED_MARKER) computed = true;
      attributes.set(name, value);
    }
    return { ...element, attributes, computed };
  });
}
