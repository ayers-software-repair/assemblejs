// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AnyNode } from "acorn";
import type { LiteralValue } from "./literal-value.js";

/**
 * What an expression is, as far as it is written as a literal, read without running it: a
 * string, a number, a negated number, a boolean, null, a template with no placeholder, and
 * objects and arrays of those; anything else, a spread or a computed key among them, is
 * undefined, known only to be there.
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
      const entries: Record<string, LiteralValue> = {};
      for (const property of node.properties) {
        if (property.type !== "Property" || property.computed) continue;
        const key = property.key;
        const name =
          key.type === "Identifier" ? key.name : key.type === "Literal" ? key.value : undefined;
        if (typeof name === "string") entries[name] = literalOf(property.value);
      }
      return entries;
    }
    default:
      return undefined;
  }
}
