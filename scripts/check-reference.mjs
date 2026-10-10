#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// The API reference documents every entry point a package publishes, under the specifier a
// user imports it by, and nothing a package does not publish.
//
// typedoc.json lists the entry files, and each names its specifier in a `@module` comment, which
// is the name typedoc gives its page. Nothing ties that list to the packages' `exports`: a
// subpath added to one and not to the other would be missing from the reference, or documented
// and unreachable, with nothing saying so. This is the tie. It also holds each entry's package
// to being one tsconfig.typedoc.json references, since typedoc reads an entry through the
// program of the package it belongs to.
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MODULE = /\/\*\* @module (\S+) \*\//;

/** Every specifier the workspace's packages publish: each package's name, and each subpath. */
function published(root) {
  const specifiers = [];
  for (const entry of readdirSync(join(root, "packages"), { withFileTypes: true })) {
    const manifestPath = join(root, "packages", entry.name, "package.json");
    if (!entry.isDirectory() || !existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    for (const subpath of Object.keys(manifest.exports ?? {})) {
      if (subpath.endsWith("package.json")) continue;
      specifiers.push(subpath === "." ? manifest.name : `${manifest.name}${subpath.slice(1)}`);
    }
  }
  return specifiers;
}

/** Each way the reference's entry points and the packages' exports disagree, as one line. */
export function referenceProblems(root) {
  const problems = [];
  const config = JSON.parse(readFileSync(join(root, "typedoc.json"), "utf8"));
  const referenced = new Set(
    JSON.parse(readFileSync(join(root, "tsconfig.typedoc.json"), "utf8")).references.map(
      (reference) => reference.path,
    ),
  );
  const named = new Map();
  for (const file of config.entryPoints) {
    if (!existsSync(join(root, file))) {
      problems.push(`typedoc.json lists ${file}, which does not exist`);
      continue;
    }
    const specifier = MODULE.exec(readFileSync(join(root, file), "utf8"))?.[1];
    if (specifier === undefined) {
      problems.push(`${file} is an entry point and names no specifier with a @module comment`);
      continue;
    }
    if (named.has(specifier)) {
      problems.push(`${file} and ${named.get(specifier)} both name ${specifier}`);
    }
    named.set(specifier, file);
    const owner = file.split("/").slice(0, 2).join("/");
    if (!referenced.has(owner)) {
      problems.push(
        `${file} is an entry point, and tsconfig.typedoc.json does not reference ${owner}`,
      );
    }
  }
  const exported = published(root);
  for (const specifier of exported) {
    if (!named.has(specifier)) {
      problems.push(`${specifier} is published, and no entry point in typedoc.json names it`);
    }
  }
  for (const [specifier, file] of named) {
    if (!exported.includes(specifier)) {
      problems.push(`${file} names ${specifier}, which no package publishes`);
    }
  }
  return problems;
}

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    // A subpath published and not documented, an entry that names nothing, one that names what
    // nobody publishes, and one whose package is not referenced: each refused, then all clean.
    const root = mkdtempSync(join(tmpdir(), "check-reference-"));
    const write = (path, contents) => {
      mkdirSync(join(root, path, ".."), { recursive: true });
      writeFileSync(join(root, path), contents);
    };
    const settings = (entryPoints, references) => {
      write("typedoc.json", JSON.stringify({ entryPoints }));
      write(
        "tsconfig.typedoc.json",
        JSON.stringify({ references: references.map((path) => ({ path })) }),
      );
    };
    try {
      write(
        "packages/one/package.json",
        JSON.stringify({
          name: "@x/one",
          exports: { ".": {}, "./client": {}, "./package.json": "" },
        }),
      );
      write("packages/one/src/index.ts", "/** @module @x/one */\n");
      write("packages/one/src/client/index.ts", "// no name\n");
      write("packages/one/src/extra.ts", "/** @module @x/one/extra */\n");
      settings(
        [
          "packages/one/src/index.ts",
          "packages/one/src/client/index.ts",
          "packages/one/src/extra.ts",
        ],
        [],
      );
      const seen = referenceProblems(root);
      const wanted = [
        "packages/one/src/client/index.ts is an entry point and names no specifier",
        "packages/one/src/index.ts is an entry point, and tsconfig.typedoc.json does not reference packages/one",
        "@x/one/client is published, and no entry point in typedoc.json names it",
        "packages/one/src/extra.ts names @x/one/extra, which no package publishes",
      ];
      const missed = wanted.filter((start) => !seen.some((line) => line.startsWith(start)));
      write("packages/one/src/client/index.ts", "/** @module @x/one/client */\n");
      settings(["packages/one/src/index.ts", "packages/one/src/client/index.ts"], ["packages/one"]);
      const clean = referenceProblems(root);
      if (missed.length > 0 || clean.length > 0) {
        console.error("reference check self-test: FAILED");
        for (const line of missed) console.error(`  did not refuse: ${line}`);
        for (const line of clean) console.error(`  refused a reference that agrees: ${line}`);
        process.exit(1);
      }
      console.log(
        "reference check self-test: red on an export with no entry, an entry with no name, a name nobody publishes and a package not referenced, as required",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
    process.exit(0);
  }
  const problems = referenceProblems(".");
  if (problems.length > 0) {
    console.error(`reference check: ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("reference check: every published entry point is documented under its specifier");
}
