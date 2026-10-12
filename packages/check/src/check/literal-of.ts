// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AnyNode } from "acorn";
import type { LiteralValue } from "./literal-value.js";
import { UNWRITTEN } from "./unwritten.js";

/**
 * What an expression is, as far as it is written as a literal, read without running it: a
 * string, a number, a negated number, a boolean, null, a template with no placeholder, and
 * objects and arrays of those; anything else is undefined, known only to be there. A spread in
 * an array is such an element; an object with a spread or a computed key has no name for what
 * it brings in, so it is marked UNWRITTEN beside the entries it does name.
 */
export function literalOf(node: AnyNode): LiteralValue {
  switch (node.type) {
    case "Literal": {
      const value = node.value;
      return typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
        ? value
        : undefined;
    }
    case "UnaryExpression": {
      const inner = node.argument.type === "Literal" ? node.argument.value : undefined;
      return node.operator === "-" && typeof inner === "number" ? -inner : undefined;
    }
    case "TemplateLiteral":
      return node.expressions.length === 0
        ? (node.quasis[0]?.value.cooked ?? undefined)
        : undefined;
    case "ArrayExpression":
      return node.elements.map((element) =>
        element === null || element.type === "SpreadElement" ? undefined : literalOf(element),
      );
    case "ObjectExpression": {
      const entries: { [key: string]: LiteralValue; [UNWRITTEN]?: true } = {};
      for (const property of node.properties) {
        if (property.type !== "Property" || property.computed) {
          entries[UNWRITTEN] = true;
          continue;
        }
        const key = property.key;
        const name =
          key.type === "Identifier"
            ? key.name
            : key.type === "Literal" &&
                (typeof key.value === "string" || typeof key.value === "number")
              ? String(key.value)
              : undefined;
        if (name !== undefined) entries[name] = literalOf(property.value);
      }
      return entries;
    }
    default:
      return undefined;
  }
}
