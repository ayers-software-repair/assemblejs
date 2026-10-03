// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { parse } from "acorn";
import type { AnyNode, Expression, Program } from "acorn";
import { transformSync } from "esbuild";
import type { LiteralValue } from "./literal-value.js";

/**
 * What a TypeScript module default-exports, as far as it is written as literals, read without
 * running any of it: the module is compiled to plain JavaScript and parsed, and its default
 * export (or the single argument of the call it is, as in `definePage({ ... })`) is read as
 * literals, anything computed null. Throws for a module that cannot be compiled or parsed.
 */
export function readDefaultExport(source: string): LiteralValue {
  const code = transformSync(source, { loader: "ts", format: "esm" }).code;
  const program = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  let exported = defaultExpression(program);
  // A name exported, or passed on, is followed to what it was declared as, a few steps at most.
  for (let step = 0; step < 4 && exported?.type === "Identifier"; step += 1) {
    exported = initialiser(program, exported.name);
  }
  if (exported === undefined) return null;
  const value =
    exported.type === "CallExpression" && exported.arguments[0]?.type !== "SpreadElement"
      ? exported.arguments[0]
      : exported;
  return value === undefined ? null : literal(value);
}

function defaultExpression(program: Program): Expression | undefined {
  for (const statement of program.body) {
    if (statement.type === "ExportDefaultDeclaration") {
      const declaration = statement.declaration;
      return declaration.type.endsWith("Declaration") ? undefined : (declaration as Expression);
    }
    if (statement.type === "ExportNamedDeclaration") {
      for (const specifier of statement.specifiers) {
        const exported = specifier.exported;
        const name = exported.type === "Identifier" ? exported.name : exported.value;
        if (name !== "default" || specifier.local.type !== "Identifier") continue;
        return initialiser(program, specifier.local.name);
      }
    }
  }
  return undefined;
}

function initialiser(program: Program, name: string): Expression | undefined {
  for (const statement of program.body) {
    if (statement.type !== "VariableDeclaration") continue;
    for (const declarator of statement.declarations) {
      if (declarator.id.type === "Identifier" && declarator.id.name === name) {
        return declarator.init ?? undefined;
      }
    }
  }
  return undefined;
}

function literal(node: AnyNode): LiteralValue {
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" ? node.value : null;
    case "TemplateLiteral":
      return node.expressions.length === 0 ? (node.quasis[0]?.value.cooked ?? null) : null;
    case "ArrayExpression":
      return node.elements.map((element) =>
        element === null || element.type === "SpreadElement" ? null : literal(element),
      );
    case "ObjectExpression": {
      const entries: Record<string, LiteralValue> = {};
      for (const property of node.properties) {
        if (property.type !== "Property" || property.computed) continue;
        const key = property.key;
        const name =
          key.type === "Identifier" ? key.name : key.type === "Literal" ? key.value : undefined;
        if (typeof name === "string") entries[name] = literal(property.value);
      }
      return entries;
    }
    default:
      return null;
  }
}
