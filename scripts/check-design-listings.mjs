#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// The design lists some of the framework's types in code blocks, and a listing nothing checks
// goes on saying what a type was. Each declaration docs/DESIGN.md writes in a `ts` block is
// held here to the declaration of that name in the source: the same members under the same
// names, each optional where the source's is and of the same type; the same members of a
// union; the same parameters and result of a function. `readonly`, comments and layout are the
// listing's to leave out. Nothing else is.
//
// A declaration is found by its name, in the file the organization rules give it:
// `AssemblyRequest` in `assembly-request.ts`, somewhere under packages/*/src.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const printer = ts.createPrinter({ removeComments: true });
const parsed = (text) => ts.createSourceFile("listing.ts", text, ts.ScriptTarget.Latest, true);
/** A node as text with nothing in it a listing may leave out. */
const plain = (node, file) =>
  printer
    .printNode(ts.EmitHint.Unspecified, node, file)
    .replace(/\breadonly\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** One member of an object type as `name?: type`, a method with its parameters. */
const member = (node, file) => {
  const name = node.name === undefined ? "" : node.name.getText(file);
  const optional = node.questionToken === undefined ? "" : "?";
  const type = node.type === undefined ? "unknown" : plain(node.type, file);
  if (ts.isMethodSignature(node)) {
    const parameters = node.parameters.map((one) => plain(one, file)).join(", ");
    return [name, `${name}${optional}(${parameters}): ${type}`];
  }
  return [name, `${name}${optional}: ${type}`];
};

/**
 * What a declaration says, in a form two spellings of it share: for an object type its
 * members by name, for a union its members in order of their text, for anything else its text.
 */
const shape = (node, file) => {
  if (ts.isFunctionDeclaration(node)) {
    const parameters = node.parameters.map((one) => plain(one, file)).join(", ");
    return {
      text: `(${parameters}): ${node.type === undefined ? "void" : plain(node.type, file)}`,
    };
  }
  const type = ts.isInterfaceDeclaration(node) ? node : node.type;
  if (ts.isInterfaceDeclaration(type) || ts.isTypeLiteralNode(type)) {
    return { members: new Map(type.members.map((one) => member(one, file))) };
  }
  if (ts.isUnionTypeNode(type)) {
    const parts = type.types.map((one) =>
      ts.isTypeLiteralNode(one)
        ? `{ ${one.members
            .map((each) => member(each, file)[1])
            .sort()
            .join("; ")} }`
        : plain(one, file),
    );
    return { members: new Map(parts.map((part) => [part, part])) };
  }
  return { text: plain(type, file) };
};

/** Every type, interface and function a text declares at its top level, by name. */
const declared = (text) => {
  const file = parsed(text);
  const found = new Map();
  for (const statement of file.statements) {
    if (
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isFunctionDeclaration(statement)) &&
      statement.name !== undefined
    ) {
      found.set(statement.name.text, shape(statement, file));
    }
  }
  return found;
};

/** The `ts` blocks of a Markdown document, each as its text. */
const blocks = (markdown) =>
  [...markdown.matchAll(/^```ts\n([\s\S]*?)^```$/gm)].map((block) => block[1] ?? "");

/**
 * Every way a listing in the design differs from the source it lists, one line each.
 * `sourceOf` answers the source that declares a name, or undefined when none does.
 */
export function problems(design, sourceOf) {
  const found = [];
  for (const block of blocks(design)) {
    for (const [name, listed] of declared(block)) {
      const source = sourceOf(name);
      const real = source === undefined ? undefined : declared(source).get(name);
      if (real === undefined) {
        found.push(`${name} is listed, and no source declares it`);
      } else if (listed.members === undefined || real.members === undefined) {
        if (listed.text !== real.text || listed.members !== real.members) {
          found.push(
            `${name} is listed as ${listed.text ?? "an object"}, and the source says ${real.text ?? "an object"}`,
          );
        }
      } else {
        for (const [key, text] of listed.members) {
          if (!real.members.has(key)) found.push(`${name} lists ${text}, which the source lacks`);
          else if (real.members.get(key) !== text) {
            found.push(`${name} lists ${text}, and the source says ${real.members.get(key)}`);
          }
        }
        for (const [key, text] of real.members) {
          if (!listed.members.has(key)) found.push(`${name} has ${text}, which its listing lacks`);
        }
      }
    }
  }
  return found;
}

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
/** The source files under `root` named for a declaration, as the organization rules name one. */
const filesNamed = (root, name) => {
  const wanted = `${kebab(name)}.ts`;
  const found = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      if (entry === "node_modules" || entry === "dist") continue;
      if (statSync(path).isDirectory()) walk(path);
      else if (entry === wanted) found.push(path);
    }
  };
  walk(root);
  return found;
};

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    const source = {
      Order:
        "/** An order. */\nexport interface Order {\n  readonly id: string;\n  /** When it has one. */\n  readonly note?: string;\n  readonly lines: readonly string[];\n  total(tax: number): number;\n}",
      State: 'export type State = "open" | "paid" | { readonly held: string };',
      settle:
        "export async function settle(order: Order, at?: number): Promise<State> { return 'paid'; }",
    };
    const listing = (body) => `Prose.\n\n\`\`\`ts\n${body}\n\`\`\`\n`;
    const inStep = listing(
      'type Order = {\n  id: string; // its id\n  note?: string;\n  lines: readonly string[];\n  total(tax: number): number;\n};\ntype State = { held: string } | "paid" | "open";\ndeclare function settle(order: Order, at?: number): Promise<State>;',
    );
    const cases = [
      [
        "a member the listing lacks",
        "type Order = { id: string; note?: string; total(tax: number): number };",
        "Order has lines: string[], which its listing lacks",
      ],
      [
        "a member the source lacks",
        "type Order = { id: string; note?: string; lines: string[]; total(tax: number): number; paid: boolean };",
        "Order lists paid: boolean, which the source lacks",
      ],
      [
        "a member required where the source's is optional",
        "type Order = { id: string; note: string; lines: string[]; total(tax: number): number };",
        "Order lists note: string, and the source says note?: string",
      ],
      [
        "a member of another type",
        "type Order = { id: number; note?: string; lines: string[]; total(tax: number): number };",
        "Order lists id: number, and the source says id: string",
      ],
      [
        "a method with other parameters",
        "type Order = { id: string; note?: string; lines: string[]; total(): number };",
        "Order lists total(): number, and the source says total(tax: number): number",
      ],
      [
        "a union that lacks a member",
        'type State = "open" | { held: string };',
        'State has "paid", which its listing lacks',
      ],
      [
        "a function with another result",
        "declare function settle(order: Order, at?: number): State;",
        "settle is listed as (order: Order, at?: number): State, and the source says (order: Order, at?: number): Promise<State>",
      ],
      [
        "a name no source declares",
        "type Receipt = { id: string };",
        "Receipt is listed, and no source declares it",
      ],
    ];
    const sourceOf = (name) => source[name];
    const missed = cases.filter(
      ([, body, wanted]) => !problems(listing(body), sourceOf).includes(wanted),
    );
    const clean = problems(inStep, sourceOf);
    if (missed.length > 0 || clean.length > 0) {
      console.error("design listings self-test: FAILED");
      for (const [title, body] of missed) {
        console.error(
          `  did not refuse ${title}; it said: ${problems(listing(body), sourceOf).join(" | ")}`,
        );
      }
      for (const line of clean) console.error(`  refused a listing in step: ${line}`);
      process.exit(1);
    }
    console.log(
      `design listings self-test: red on ${cases.length} ways out of step, clean on a listing in step, as required`,
    );
    process.exit(0);
  }
  const design = readFileSync("docs/DESIGN.md", "utf8");
  const sourceOf = (name) =>
    readdirSync("packages")
      .map((one) => join("packages", one, "src"))
      .filter((root) => existsSync(root))
      .flatMap((root) => filesNamed(root, name))
      .map((path) => readFileSync(path, "utf8"))
      .find((text) => declared(text).has(name));
  const found = problems(design, sourceOf);
  if (found.length > 0) {
    for (const line of found) console.error(`design listings: ${line}`);
    process.exit(1);
  }
  const listed = blocks(design).flatMap((block) => [...declared(block).keys()]);
  console.log(`design listings: ${listed.length} declaration(s) listed, each as its source has it`);
}
