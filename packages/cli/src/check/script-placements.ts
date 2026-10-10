// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_VIEW } from "@assemblejs/core";
import { parse } from "acorn";
import type { AnyNode, Expression, ObjectExpression, SpreadElement, Super } from "acorn";
import { transformSync } from "esbuild";
import { collectPlacements } from "./collect-placements.js";
import { isRendererClient } from "./is-renderer-client.js";
import type { ViewPlacements } from "./view-placements.js";

type Argument = Expression | SpreadElement | undefined;

const walk = (node: unknown, visit: (node: AnyNode) => void): void => {
  if (typeof node !== "object" || node === null) return;
  if (Array.isArray(node)) {
    for (const one of node) walk(one, visit);
    return;
  }
  if (typeof (node as { readonly type?: unknown }).type === "string") visit(node as AnyNode);
  for (const value of Object.values(node)) walk(value, visit);
};

// A string written in place: a string literal, or a template literal with nothing computed.
const written = (node: Argument): string | undefined => {
  if (node?.type === "Literal") return typeof node.value === "string" ? node.value : undefined;
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
};

// A property of an object written in place, and whether the object could hold it unseen.
const property = (
  object: ObjectExpression,
  key: string,
): { readonly value: Argument; readonly present: boolean } => {
  let spread = false;
  for (const one of object.properties) {
    if (one.type === "SpreadElement") spread = true;
    else if (!one.computed && one.key.type === "Identifier" && one.key.name === key) {
      return { value: one.value, present: true };
    } else if (one.key.type === "Literal" && one.key.value === key) {
      return { value: one.value, present: true };
    }
  }
  return { value: undefined, present: spread };
};

/**
 * The slots a view written as a module places, read from its source and never run: every
 * `<Slot name="...">` of a renderer's `Slot`, and every call of a renderer's `slot("...")`,
 * under whatever name the module imports them, or under the namespace it imports the whole
 * client as. A view written in place is read; one the module computes is left out of the
 * placement; a name it computes is reported.
 *
 * Throws for a module that cannot be compiled or parsed. A slot handed on under another name,
 * assigned or passed, is not seen here, and is left to the render.
 */
export function scriptPlacements(source: string, loader: "ts" | "tsx"): ViewPlacements {
  const code = transformSync(source, { loader, format: "esm", jsx: "automatic" }).code;
  const program = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const components = new Set<string>();
  const functions = new Set<string>();
  const namespaces = new Set<string>();
  for (const statement of program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    if (!isRendererClient(String(statement.source.value))) continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type === "ImportNamespaceSpecifier") namespaces.add(specifier.local.name);
      if (specifier.type !== "ImportSpecifier") continue;
      const imported =
        specifier.imported.type === "Identifier"
          ? specifier.imported.name
          : String(specifier.imported.value);
      if (imported === "Slot") components.add(specifier.local.name);
      if (imported === "slot") functions.add(specifier.local.name);
    }
  }
  // What an expression names of a renderer's client, as the module writes it: an imported
  // name, or a member of a namespace, `client.slot` and `client["slot"]` alike.
  const named = (
    node: Expression | SpreadElement | Super | undefined,
    exported: "Slot" | "slot",
  ): string | undefined => {
    const locals = exported === "Slot" ? components : functions;
    if (node?.type === "Identifier") return locals.has(node.name) ? node.name : undefined;
    if (node?.type !== "MemberExpression" || node.object.type !== "Identifier") return undefined;
    if (!namespaces.has(node.object.name)) return undefined;
    const member = node.computed
      ? written(node.property as Expression)
      : node.property.type === "Identifier"
        ? node.property.name
        : undefined;
    return member === exported ? `${node.object.name}.${exported}` : undefined;
  };

  const found: { name: string | undefined; view: string | undefined; shown: string }[] = [];
  walk(program, (node) => {
    if (node.type !== "CallExpression") return;
    const [first, second] = node.arguments;
    const called = named(node.callee, "slot");
    const component = named(first, "Slot");
    if (called !== undefined) {
      found.push({
        name: written(first),
        view: second === undefined ? DEFAULT_VIEW : written(second),
        shown: `${called}(...) with a name the view computes`,
      });
    } else if (component !== undefined) {
      const props = second?.type === "ObjectExpression" ? second : undefined;
      const name = props === undefined ? undefined : property(props, "name");
      const view = props === undefined ? undefined : property(props, "view");
      found.push({
        name: written(name?.value),
        view: view?.present === false ? DEFAULT_VIEW : written(view?.value),
        shown: `<${component}> with a name the view computes`,
      });
    }
  });
  return collectPlacements(found);
}
