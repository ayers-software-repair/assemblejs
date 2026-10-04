// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isBuiltin } from "node:module";
import { parse } from "acorn";
import type { Node } from "acorn";

/**
 * The package a bare specifier names: its scope and name, without any subpath. A `#` specifier
 * is one of the project's own subpath imports, named whole.
 */
const packageOf = (specifier: string): string => {
  const parts = specifier.split("/");
  if (specifier.startsWith("#")) return specifier;
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier);
};

/**
 * The packages a built server imports, by name, read from its code: every static import, export
 * from, and dynamic import of a literal, that is neither relative nor one of node's own. The
 * build leaves packages external, so these are what a deploy must be able to install.
 */
export function serverImports(code: string): readonly string[] {
  const found = new Set<string>();
  const visit = (node: unknown): void => {
    if (node === null || typeof node !== "object") return;
    const current = node as Node & { source?: { type: string; value?: unknown } };
    if (
      (current.type === "ImportDeclaration" ||
        current.type === "ImportExpression" ||
        current.type === "ExportAllDeclaration" ||
        current.type === "ExportNamedDeclaration") &&
      current.source?.type === "Literal" &&
      typeof current.source.value === "string"
    ) {
      const specifier = current.source.value;
      if (!specifier.startsWith(".") && !specifier.startsWith("/") && !isBuiltin(specifier)) {
        found.add(packageOf(specifier));
      }
    }
    for (const value of Object.values(current)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value !== null && typeof value === "object") visit(value);
    }
  };
  visit(parse(code, { ecmaVersion: "latest", sourceType: "module" }));
  return [...found].sort();
}
