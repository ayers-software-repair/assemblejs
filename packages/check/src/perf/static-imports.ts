// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { parse } from "acorn";

/**
 * What a module imports before it runs: every specifier it imports from or exports from, in the
 * order written, read off its source and never run. A browser loads each of them before the
 * module runs a line, so they are part of what a page sends before anything mounts. What it
 * asks for with `import()` is loaded when that line runs, and is not among them.
 *
 * Nothing for a source that does not parse as a module: what a browser makes of that is not
 * this reader's to say.
 */
export function staticImports(source: string): readonly string[] {
  let program;
  try {
    program = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const statement of program.body) {
    if (
      (statement.type === "ImportDeclaration" ||
        statement.type === "ExportNamedDeclaration" ||
        statement.type === "ExportAllDeclaration") &&
      typeof statement.source?.value === "string"
    ) {
      found.push(statement.source.value);
    }
  }
  return found;
}
