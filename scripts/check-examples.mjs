#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Every example is held to the TypeScript setup the build writes for it. For each one: the build
// writes `.assemblejs/`, `tsc -b` checks the solution it names, `vue-tsc` checks the project that
// holds the Vue views and `svelte-check` the one that holds the Svelte views. A view is in that
// project because the generated modules import it, so nothing in an example names it to a checker.
//
// Every stage of an example runs even when an earlier one failed, so one run names everything
// wrong with it. An example keeps no tsconfig of its own: what is checked is what a user's project
// is given.
//
// --self-test copies an example, puts a type error in a React view, a Vue view and a Svelte view,
// and holds the gate to a red from exactly those three checkers.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");
const NODE = process.execPath;
const CLI = join(ROOT, "packages/cli/dist/bin.js");
const TSC = join(ROOT, "node_modules/typescript/bin/tsc");
const VUE_TSC = join(ROOT, "node_modules/vue-tsc/bin/vue-tsc.js");
const SVELTE_CHECK = join(ROOT, "node_modules/svelte-check/bin/svelte-check");
const APP = ".assemblejs/tsconfig.app.json";

/** The example projects: a directory under `examples/` or `examples/market/` with a package.json. */
export function examplesOf(root) {
  const found = [];
  for (const parent of [join(root, "examples"), join(root, "examples/market")]) {
    if (!existsSync(parent)) continue;
    for (const entry of readdirSync(parent, { withFileTypes: true })) {
      const dir = join(parent, entry.name);
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        existsSync(join(dir, "package.json"))
      ) {
        found.push(dir);
      }
    }
  }
  return found.sort();
}

/** Whether any file under `dir`, outside node_modules, ends in `extension`. */
export function holds(dir, extension) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".") || entry.name === "dist")
      continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory() ? holds(path, extension) : path.endsWith(extension)) return true;
  }
  return false;
}

const run = (script, args, cwd) => {
  const result = spawnSync(NODE, [script, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}`.trim() };
};

/**
 * The stages of one example, each as `{ stage, ok, output }`. Vue's checker reads the written
 * application project and not the solution: the solution is TypeScript's, and the Vue and Svelte
 * views belong to the application project because no JSX owner has them.
 */
export function checkExample(dir) {
  const results = [];
  // An example with no build is plain JavaScript run as it stands: nothing is written for it to check.
  if (!JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).scripts?.build) return results;
  const stage = (name, script, args) => results.push({ stage: name, ...run(script, args, dir) });
  stage("build", CLI, ["build"]);
  if (!results[0].ok) return results;
  stage("tsc", TSC, ["-b"]);
  if (holds(join(dir, "src"), ".vue")) stage("vue-tsc", VUE_TSC, ["-p", APP, "--noEmit"]);
  if (holds(join(dir, "src"), ".svelte")) {
    stage("svelte-check", SVELTE_CHECK, [
      "--workspace",
      ".",
      "--tsconfig",
      APP,
      "--output",
      "human",
    ]);
  }
  return results;
}

const line = (dir, results) => {
  if (results.length === 0) return `skip  ${dir}  no build script, plain JavaScript`;
  const failed = results.filter((one) => !one.ok).map((one) => one.stage);
  const ran = results.map((one) => one.stage).join(" ");
  return failed.length === 0
    ? `ok    ${dir}  ${ran}`
    : `FAIL  ${dir}  ${ran}  (failed: ${failed.join(", ")})`;
};

const indented = (text) =>
  text
    .split("\n")
    .map((row) => `      ${row}`)
    .join("\n");

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    const source = join(ROOT, "examples/frameworks");
    const copy = join(ROOT, "examples", `.check-examples-self-test-${process.pid}`);
    const broken = (path, from, to) => {
      const file = join(copy, path);
      const text = readFileSync(file, "utf8");
      if (!text.includes(from)) throw new Error(`self-test: ${path} no longer holds ${from}`);
      writeFileSync(file, text.replace(from, to));
    };
    let seen;
    try {
      mkdirSync(copy);
      cpSync(join(source, "package.json"), join(copy, "package.json"));
      cpSync(join(source, "tsconfig.json"), join(copy, "tsconfig.json"));
      cpSync(join(source, "src"), join(copy, "src"), { recursive: true });
      symlinkSync(join(source, "node_modules"), join(copy, "node_modules"), "dir");
      broken(
        "src/assemblies/react-counter/react-counter.react.tsx",
        "export",
        "const wrong: number = 'text';\nexport",
      );
      broken(
        "src/assemblies/vue-counter/vue-counter.vue",
        "const count = ref(0);",
        "const count = ref(0);\nconst wrong: number = 'text';",
      );
      broken(
        "src/assemblies/svelte-counter/svelte-counter.svelte",
        "let count = $state(0);",
        "let count = $state(0);\n  const wrong: number = 'text';",
      );
      seen = checkExample(copy);
    } finally {
      rmSync(copy, { recursive: true, force: true });
    }
    const red = seen.filter((one) => !one.ok).map((one) => one.stage);
    if (red.join() !== "tsc,vue-tsc,svelte-check") {
      console.error(
        "examples gate self-test FAILED: expected red from tsc, vue-tsc and svelte-check",
      );
      for (const one of seen) console.error(`  ${one.stage}: ${one.ok ? "green" : "red"}`);
      process.exit(1);
    }
    console.log("examples gate self-test: red on a type error in a React, a Vue and a Svelte view");
    process.exit(0);
  }

  const failures = [];
  const started = Date.now();
  const examples = examplesOf(ROOT);
  for (const dir of examples) {
    const name = dir.slice(ROOT.length + 1);
    const results = checkExample(dir);
    console.log(line(name, results));
    for (const one of results.filter((result) => !result.ok)) {
      failures.push(name);
      console.error(`    ${one.stage}:\n${indented(one.output)}`);
    }
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const bad = new Set(failures);
  if (bad.size > 0) {
    console.error(`examples check failed: ${bad.size} of ${examples.length} (${seconds}s)`);
    process.exit(1);
  }
  console.log(`examples check: clean (${examples.length} example(s), ${seconds}s)`);
}
