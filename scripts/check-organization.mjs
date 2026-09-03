#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The organization rules in CLAUDE.md, read off the TypeScript AST rather than off a regex,
// because a rule about declarations has to count declarations. Rules 1, 2, 3, 4, 6 and 7.
//
// Point it at a directory to check that tree instead of packages/*/src: the self-test does
// exactly that against scripts/fixtures/organization-bad/, which is how this gate is watched
// refusing before it is trusted.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const BANNED_DIRECTORIES = new Set(["utils", "helpers", "common", "misc", "shared", "lib"]);
const MAX_LINES = 300;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Every extension TypeScript will compile. Walking only ".ts" left ".mts", ".cts" and ".tsx"
// invisible to every rule below, which is a hole shaped exactly like the rules themselves.
const SOURCE = /\.(ts|tsx|mts|cts)$/;

const sourceFiles = (root) => {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (SOURCE.test(path) && !path.endsWith(".d.ts")) found.push(path);
    }
  };
  walk(root);
  return found.sort();
};

const parse = (path) =>
  ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.ES2022, true);

/**
 * Names this file declares and exports itself, ignoring anything it merely re-exports.
 *
 * Three forms, because a file can export the same thing three ways and only one of them wears
 * the `export` modifier. Counting the modifier alone let `export { x }` and `export default`
 * through, so a second declaration could be added to any file without the gate noticing.
 */
const declaredExports = (file) => {
  const names = [];
  for (const node of file.statements) {
    if (ts.isExportAssignment(node)) {
      names.push("default");
      continue;
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier === undefined) {
      const clause = node.exportClause;
      if (clause !== undefined && ts.isNamedExports(clause)) {
        for (const element of clause.elements) names.push(element.name.getText(file));
      }
      continue;
    }
    const exported = ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) names.push(d.name.getText(file));
    } else if (node.name) {
      names.push(node.name.getText(file));
    }
  }
  return names;
};

/** Module specifiers this file re-exports from, and the ones it imports from. */
const reExportSpecifiers = (file) =>
  file.statements
    .filter((n) => (ts.isExportDeclaration(n) && n.moduleSpecifier) !== undefined)
    .filter((n) => ts.isExportDeclaration(n) && n.moduleSpecifier)
    .map((n) => n.moduleSpecifier.text);

const importSpecifiers = (file) =>
  file.statements.filter((n) => ts.isImportDeclaration(n)).map((n) => n.moduleSpecifier.text);

// PascalCase, camelCase and SCREAMING_SNAKE all reduce to the same kebab filename, so a
// constant and an interface are named by the same rule.
const expectedName = (name) =>
  name
    .replace(/_/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();

/** The package a source file belongs to, so a module importing its own package is detectable. */
const owningPackage = (path) => {
  const match = /(^|\/)packages\/([^/]+)\//.exec(path);
  if (match === null) return undefined;
  try {
    return JSON.parse(readFileSync(join("packages", match[2], "package.json"), "utf8")).name;
  } catch {
    return undefined;
  }
};

export function checkTree(root) {
  root = root.replace(/\/+$/, "");
  const problems = [];
  const fail = (path, rule, message) => problems.push(`${path}: [rule ${rule}] ${message}`);

  for (const path of sourceFiles(root)) {
    const rel = relative(process.cwd(), path);
    const file = parse(path);
    const name = basename(path, ".ts");
    // A bin is an executable entry, not a module: it exports nothing because nothing imports
    // it. Same category as an index, which is why both skip the one-declaration rule.
    const isEntry = name === "index" || name === "bin";
    const isIndex = isEntry;

    // Rule 7: the ceiling.
    const lines = readFileSync(path, "utf8").split("\n").length;
    if (lines > MAX_LINES) fail(rel, 7, `${lines} lines, ceiling is ${MAX_LINES}`);

    // Rule 6: no drawer directories.
    for (const segment of dirname(rel).split("/")) {
      if (BANNED_DIRECTORIES.has(segment)) {
        fail(
          rel,
          6,
          `lives in a "${segment}" directory; a file belongs to the concept that owns it`,
        );
        break;
      }
    }

    const declared = declaredExports(file);

    if (isIndex) {
      // Rule 2: an index only re-exports.
      if (declared.length > 0) {
        fail(rel, 2, `an index declares nothing, and this declares ${declared.join(", ")}`);
      }
      // Rule 3: the tree's own surface names child indexes, never leaves. Keyed on being the
      // index AT the root, not on the path spelling: the first version keyed on "src/index.ts"
      // and so was silent on every tree that was not called src, including its own fixture.
      if (dirname(path) === root) {
        for (const spec of reExportSpecifiers(file)) {
          if (!spec.endsWith("/index.js")) {
            fail(rel, 3, `re-exports the leaf "${spec}"; the surface names child indexes only`);
          }
        }
      }
      continue;
    }

    // Rule 1: one declaration, named by the file.
    if (declared.length === 0) {
      fail(
        rel,
        1,
        "exports nothing; a source file that is not an index declares exactly one thing",
      );
    } else if (declared.length > 1) {
      fail(rel, 1, `exports ${declared.length} things (${declared.join(", ")}); one per file`);
    } else {
      if (!KEBAB.test(name)) fail(rel, 1, `filename "${name}" is not kebab-case`);
      const want = expectedName(declared[0]);
      if (name !== want) fail(rel, 1, `exports ${declared[0]}, so the file is "${want}.ts"`);
    }

    // Rule 4: a sibling imports the leaf, never an index.
    //
    // Both spellings of the same mistake. A relative path ending in index.js is the obvious one.
    // The package's own name is the same mistake wearing a different specifier, and it is worse:
    // it resolves through the exports map, so the edge is invisible to the module graph and the
    // cycle it creates passes every other gate.
    const own = owningPackage(path);
    for (const spec of [...importSpecifiers(file), ...reExportSpecifiers(file)]) {
      if (spec.startsWith(".") && /(^|\/)index\.js$/.test(spec)) {
        fail(
          rel,
          4,
          `imports "${spec}"; inside a package a module imports the leaf, never an index`,
        );
      } else if (own !== undefined && (spec === own || spec.startsWith(`${own}/`))) {
        fail(
          rel,
          4,
          `imports its own package as "${spec}"; a module imports the leaf by relative path, never the package surface`,
        );
      }
    }
  }
  return problems;
}

// This module is imported by its own tests and by other tooling, so the command-line body only
// runs when it IS the command. Without the guard, importing the module silently ran a full scan
// and printed a verdict nobody asked for.
const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    const fixture = "scripts/fixtures/organization-bad";
    try {
      statSync(fixture);
    } catch {
      console.error(`organization gate self-test FAILED: ${fixture} is missing`);
      process.exit(1);
    }
    const found = checkTree(fixture);
    const fired = new Set(found.map((p) => p.match(/\[rule (\d)\]/)?.[1]));
    const expected = ["1", "2", "3", "4", "6", "7"];
    const silent = expected.filter((r) => !fired.has(r));
    if (silent.length) {
      console.error(
        `organization gate self-test FAILED: rule(s) ${silent.join(", ")} did not fire`,
      );
      for (const p of found) console.error(`  saw: ${p}`);
      process.exit(1);
    }
    console.log(`organization gate self-test: red on rules ${expected.join(", ")}, as required`);
    process.exit(0);
  }

  const roots = process.argv.slice(2);
  if (roots.length === 0) {
    for (const pkg of readdirSync("packages", { withFileTypes: true })) {
      if (!pkg.isDirectory()) continue;
      const src = join("packages", pkg.name, "src");
      try {
        statSync(src);
        roots.push(src);
      } catch {
        /* a package without sources yet has nothing to organize */
      }
    }
  }

  const problems = roots.flatMap((root) => checkTree(root));
  if (problems.length) {
    console.error(`organization check failed, ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`organization check: clean (${roots.length} tree(s))`);
}
