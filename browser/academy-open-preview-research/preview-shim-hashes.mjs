// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import ts from "typescript";

export function previewShimHashes(text) {
  const names = ["NET_SHIM", "TITLE_SHIM", "WS_SHIM", "SSE_SHIM"];
  const values = new Map();
  const source = ts.createSourceFile("sw.js", text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !names.includes(declaration.name.text)) continue;
      const value = declaration.initializer;
      if (!value || (!ts.isStringLiteral(value) && !ts.isNoSubstitutionTemplateLiteral(value)))
        throw new Error("preview shim must be a static string literal");
      if (values.has(declaration.name.text)) throw new Error("duplicate preview shim");
      values.set(declaration.name.text, value.text);
    }
  }
  if (values.size !== names.length) throw new Error("incomplete preview shim inventory");
  return names.map(
    (name) => `'sha256-${createHash("sha256").update(values.get(name)).digest("base64")}'`,
  );
}
