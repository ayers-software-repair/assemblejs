// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { parse } from "acorn";
import type { Expression, Program } from "acorn";
import { transformSync } from "esbuild";
import { initialiserOf } from "./initialiser-of.js";
import { literalOf } from "./literal-of.js";
import type { LiteralValue } from "./literal-value.js";

/**
 * What a module exports under a name, as far as it is written as a literal, read without
 * running any of it: `export const mount = "none"` or `export { mount }` of a top-level
 * declaration. Undefined where the module does not export the name, or exports something
 * computed. The loader says what the source is, as a framework view may hold JSX. Throws for a
 * module that cannot be compiled or parsed.
 */
export function readNamedExport(
  source: string,
  name: string,
  loader: "ts" | "tsx" = "ts",
): LiteralValue {
  const code = transformSync(source, { loader, format: "esm", jsx: "automatic" }).code;
  const program = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const expression = namedExpression(program, name);
  return expression === undefined ? undefined : literalOf(expression);
}

function namedExpression(program: Program, name: string): Expression | undefined {
  for (const statement of program.body) {
    if (statement.type !== "ExportNamedDeclaration") continue;
    const declaration = statement.declaration;
    if (declaration?.type === "VariableDeclaration") {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === "Identifier" && declarator.id.name === name) {
          return declarator.init ?? undefined;
        }
      }
    }
    for (const specifier of statement.specifiers) {
      const exported = specifier.exported;
      const as = exported.type === "Identifier" ? exported.name : exported.value;
      if (as === name && specifier.local.type === "Identifier") {
        return initialiserOf(program, specifier.local.name);
      }
    }
  }
  return undefined;
}
