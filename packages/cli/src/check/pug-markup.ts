// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { PLACEMENT_ELEMENT } from "@assemblejs/core";

type Node = Readonly<Record<string, unknown>>;

const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// A string written in place, as Pug holds an attribute's value: its source, quotes and all.
const written = (value: unknown): string | undefined =>
  typeof value === "string"
    ? /^"([^"\\]*)"$|^'([^'\\]*)'$|^`([^`\\$]*)`$/
        .exec(value)
        ?.slice(1)
        .find((one) => one !== undefined)
    : undefined;

/**
 * A Pug template's parse tree as the markup its directives are written in, for the one reader
 * of directives to read as it reads a page's template. `computed` stands wherever the template
 * computes what it writes.
 *
 * A directive is the tag `assembly(name="cart")`, written here with every attribute it was
 * given and whatever is inside it, so what makes one unreadable is refused by the reader that
 * refuses it at a render. Text is kept as written,
 * which is how Pug writes it: a directive in a line of html or in text is one. Every other tag
 * is its name around what it holds, so what stands in a script or a style is still text to the
 * reader; what its own attributes hold is not read. A comment Pug writes is written. A mixin,
 * a loop and each branch of a condition are taken as written, since some render writes them.
 *
 * A tag whose own name is computed is no directive here: only a render knows what it is.
 */
export function pugMarkup(tree: unknown, computed: string): string {
  let markup = "";
  const attribute = (one: Node): string => {
    const name = String(one["name"]);
    // A name alone is written as Pug writes it, with its own name for its value.
    if (one["val"] === true) return ` ${name}="${name}"`;
    return ` ${name}="${written(one["val"]) ?? computed}"`;
  };
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const one of value) visit(one);
      return;
    }
    if (!isNode(value)) return;
    const type = value["type"];
    if (type === "Text") {
      markup += String(value["val"]);
    } else if (type === "Code") {
      if (value["buffer"] === true) markup += computed;
      visit(value["block"]);
    } else if (type === "Comment") {
      markup += `<!--${String(value["val"])}-->`;
    } else if (type === "BlockComment") {
      markup += "<!--";
      visit(value["block"]);
      markup += "-->";
    } else if (type === "Tag" || type === "InterpolatedTag") {
      const name = type === "Tag" ? String(value["name"]) : computed;
      markup += `<${name}`;
      if (name.toLowerCase() === PLACEMENT_ELEMENT) {
        for (const one of [value["attrs"]].flat()) if (isNode(one)) markup += attribute(one);
        // Attributes handed over as an object are whatever a render makes them.
        if ([value["attributeBlocks"]].flat().some(isNode)) markup += ` ${computed}`;
      }
      markup += ">";
      visit(value["block"]);
      markup += `</${name}>`;
    } else {
      // Whatever else it is, what it writes is in the blocks beneath it.
      for (const beneath of Object.values(value)) visit(beneath);
    }
  };
  visit(tree);
  return markup;
}
