// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { parse } from "acorn";

interface Loose {
  readonly type?: string;
  readonly [key: string]: unknown;
}

const asNode = (value: unknown): Loose | undefined =>
  value !== null && typeof value === "object" ? (value as Loose) : undefined;

// A property's name, written bare or quoted; a computed one is not a name.
function nameOf(property: Loose): string | undefined {
  const key = asNode(property["key"]);
  if (property["computed"] === true || key === undefined) return undefined;
  if (key.type === "Identifier" && typeof key["name"] === "string") return key["name"];
  return key.type === "Literal" && typeof key["value"] === "string" ? key["value"] : undefined;
}

// The module a property's value, `() => import("./x.js")`, asks for.
function importedBy(value: unknown): string | undefined {
  const arrow = asNode(value);
  const body = asNode(arrow?.["body"]);
  const specifier = asNode(body?.["source"]);
  return arrow?.type === "ArrowFunctionExpression" &&
    body?.type === "ImportExpression" &&
    specifier?.type === "Literal" &&
    typeof specifier["value"] === "string"
    ? specifier["value"]
    : undefined;
}

/** The module a built entry loads for each assembly, by name, read off its source and never run. */
export function lazyModules(source: string): ReadonlyMap<string, string> {
  // The map `lazyRenderer` is given: every property whose value is `() => import("./x.js")`.
  // Nothing for a source with no `import()` or one that does not parse.
  const found = new Map<string, string>();
  if (!source.includes("import(")) return found;
  let program;
  try {
    program = parse(source, { ecmaVersion: "latest", sourceType: "module" });
  } catch {
    return found;
  }
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    const node = asNode(value);
    if (node === undefined) return;
    if (node.type === "Property") {
      const name = nameOf(node);
      const module = importedBy(node["value"]);
      if (name !== undefined && module !== undefined) found.set(name, module);
    }
    for (const child of Object.values(node)) visit(child);
  };
  visit(program);
  return found;
}
