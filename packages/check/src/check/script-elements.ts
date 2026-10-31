// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@asmjs/build";
import { parse } from "acorn";
import type { AnyNode, Expression, SpreadElement } from "acorn";
import { transform } from "esbuild";
import { readElements } from "./read-elements.js";
import type { ViewElement } from "./view-element.js";

const walk = (node: unknown, visit: (node: AnyNode) => void): void => {
  if (typeof node !== "object" || node === null) return;
  if (Array.isArray(node)) {
    for (const one of node) walk(one, visit);
    return;
  }
  if (typeof (node as { readonly type?: unknown }).type === "string") visit(node as AnyNode);
  for (const value of Object.values(node)) walk(value, visit);
};

// A string written in place, or `true` for a boolean written in place; undefined for computed.
const written = (node: Expression | SpreadElement | undefined): string | true | undefined => {
  if (node?.type === "Literal") {
    if (typeof node.value === "string") return node.value;
    return node.value === true ? true : undefined;
  }
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
};

/**
 * The elements a view written as a module writes, read from its source and never run: every
 * JSX element, which esbuild's automatic runtime compiles to a call of `jsx`, `jsxs` or `jsxDEV`
 * with the tag as a string, its props the attributes, a value written in place kept and any
 * other standing as the marker; and every Lit `html` template, whose fixed parts are read as
 * markup with the marker where its expressions go. A props object spread from elsewhere makes
 * the element computed, since what it holds is only a render's to know. A component, whose tag
 * is not a string, is not an element the browser sees here, and is passed over. `at` is where
 * the element is in the compiled module, near enough to find the tag by.
 *
 * Rejects for a module that cannot be compiled or parsed.
 */
export async function scriptElements(
  source: string,
  loader: "ts" | "tsx",
): Promise<readonly ViewElement[]> {
  const code = (await transform(source, { loader, format: "esm", jsx: "automatic" })).code;
  const program = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const factories = new Set<string>();
  const templates = new Set<string>();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const from = String(statement.source.value);
    for (const specifier of statement.specifiers) {
      if (specifier.type !== "ImportSpecifier") continue;
      const imported =
        specifier.imported.type === "Identifier"
          ? specifier.imported.name
          : String(specifier.imported.value);
      if (/jsx(-dev)?-runtime$/.test(from) && ["jsx", "jsxs", "jsxDEV"].includes(imported)) {
        factories.add(specifier.local.name);
      }
      if (/^lit(\/|$)|^lit-html(\/|$)/.test(from) && imported === "html") {
        templates.add(specifier.local.name);
      }
    }
  }
  const found: ViewElement[] = [];
  walk(program, (node) => {
    if (node.type === "CallExpression") {
      if (node.callee.type !== "Identifier" || !factories.has(node.callee.name)) return;
      const [first, second] = node.arguments;
      const tag = written(first);
      if (typeof tag !== "string") return;
      const attributes = new Map<string, string | true>();
      let computed = false;
      if (second?.type === "ObjectExpression") {
        for (const one of second.properties) {
          if (one.type === "SpreadElement") {
            // An attribute nobody can name: the marker as its name says a spread stands here.
            attributes.set(COMPUTED_MARKER, true);
            computed = true;
            continue;
          }
          const key =
            !one.computed && one.key.type === "Identifier"
              ? one.key.name
              : one.key.type === "Literal"
                ? String(one.key.value)
                : undefined;
          // The children are the element's content, not an attribute the browser reads.
          if (key === undefined || key === "children") continue;
          const value = written(one.value as Expression);
          if (value === undefined) computed = true;
          attributes.set(key.toLowerCase(), value ?? COMPUTED_MARKER);
        }
      } else if (second !== undefined) {
        computed = true;
      }
      found.push({ tag: tag.toLowerCase(), attributes, at: node.start, computed });
    } else if (node.type === "TaggedTemplateExpression") {
      if (node.tag.type !== "Identifier" || !templates.has(node.tag.name)) return;
      const markup = node.quasi.quasis.map((part) => part.value.cooked ?? "").join(COMPUTED_MARKER);
      for (const element of readElements(markup)) found.push({ ...element, at: node.start });
    }
  });
  return found.sort((a, b) => a.at - b.at);
}
