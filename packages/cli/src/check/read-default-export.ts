// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { parse } from "acorn";
import type { Expression, Program } from "acorn";
import { transformSync } from "esbuild";
import { initialiserOf } from "./initialiser-of.js";
import { literalOf } from "./literal-of.js";
import type { LiteralValue } from "./literal-value.js";

/**
 * What a TypeScript module default-exports, as far as it is written as literals, read without
 * running any of it: the module is compiled to plain JavaScript and parsed, and its default
 * export (or the first argument of the one call it is, as in `definePage({ ... })`) is read as
 * literals, anything computed undefined. A name, exported or passed to that call, is followed
 * to what it was declared as, a few steps at most. Undefined too for a module that exports no
 * default. Throws for a module that cannot be compiled or parsed.
 */
export function readDefaultExport(source: string): LiteralValue {
  const code = transformSync(source, { loader: "ts", format: "esm" }).code;
  const program = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  let exported = defaultExpression(program);
  let called = false;
  for (let step = 0; step < 6 && exported !== undefined; step += 1) {
    if (exported.type === "Identifier") {
      exported = initialiserOf(program, exported.name);
    } else if (exported.type === "CallExpression" && !called) {
      called = true;
      const [argument] = exported.arguments;
      exported = argument?.type === "SpreadElement" ? undefined : argument;
    } else {
      break;
    }
  }
  return exported === undefined ? undefined : literalOf(exported);
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
        return initialiserOf(program, specifier.local.name);
      }
    }
  }
  return undefined;
}
