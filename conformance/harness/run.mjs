#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// The conformance harness. It tests a server against the design from the outside, as any other
// server or a browser meets it, over HTTP and nothing else. For each fixture:
//
//   1. build and pack the packages, once, so what is installed is what a publish would ship;
//   2. create a project from the starter's tarball and lay the fixture's files over it;
//   3. install every @assemblejs package the fixture names from its tarball, never through a
//      workspace link, and build with the command line the project installed;
//   4. start dist/server.js under plain node, in production;
//   5. run the fixture's specs, conformance/specs/<fixture>/, with node's own test runner.
//
// `pnpm conformance rendering` runs one fixture; no argument runs every one. It needs the network
// for the third-party dependencies, and minutes, so it runs on demand rather than inside
// `pnpm check`. It exits with the specs' result, and removes its working directory when every
// spec passed, keeping it to be read when one did not.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { pack } from "./pack.mjs";
import { project } from "./project.mjs";
import { serve } from "./serve.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixtures = join(here, "..", "fixtures");
const specs = join(here, "..", "specs");
const step = (text) => console.log(`\n== ${text}`);

const named = process.argv.slice(2);
const chosen = readdirSync(fixtures).filter(
  (name) =>
    existsSync(join(fixtures, name, "fixture.json")) &&
    (named.length === 0 || named.includes(name)),
);
const unknown = named.filter((name) => !chosen.includes(name));
if (unknown.length > 0 || chosen.length === 0) {
  console.error(`no such fixture: ${unknown.join(", ") || "(none found)"}`);
  process.exit(2);
}
const declared = new Map(
  chosen.map((name) => [
    name,
    JSON.parse(readFileSync(join(fixtures, name, "fixture.json"), "utf8")).packages,
  ]),
);

const work = mkdtempSync(join(tmpdir(), "assemblejs-conformance-"));
const packages = [...new Set(["core", "cli", "create", ...[...declared.values()].flat()])];
step(`pack ${packages.join(", ")}`);
let tarball;
try {
  tarball = pack(packages, join(work, "tarballs"));
} catch (error) {
  // Nothing but tarballs is in the working directory yet, and nothing in it is worth reading.
  rmSync(work, { recursive: true, force: true });
  throw error;
}

/** Runs one fixture's specs against a server built from it, answering whether every one passed. */
const conform = async (name, wanted) => {
  const files = readdirSync(join(specs, name)).filter((file) => file.endsWith(".spec.mjs"));
  if (files.length === 0) throw new Error(`conformance/specs/${name}/ holds no spec`);
  step(`${name}: create, install from the tarballs, and build`);
  const root = project(join(fixtures, name), join(work, name), tarball, wanted);
  step(`${name}: start the built server`);
  const server = await serve(root);
  console.log(server.origin);
  step(`${name}: the specs`);
  try {
    const result = spawnSync(
      process.execPath,
      ["--test", ...files.map((file) => join(specs, name, file))],
      { stdio: "inherit", env: { ...process.env, CONFORMANCE_ORIGIN: server.origin } },
    );
    return result.status === 0;
  } finally {
    await server.stop();
  }
};

const failed = [];
for (const [name, wanted] of declared) {
  try {
    if (!(await conform(name, wanted))) failed.push(name);
  } catch (error) {
    console.error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    failed.push(name);
  }
}

if (failed.length === 0) {
  rmSync(work, { recursive: true, force: true });
  console.log("\nconformance: every spec passed");
} else {
  console.log(`\nconformance: a spec failed in ${failed.join(", ")}; the projects are in ${work}`);
}
process.exit(failed.length === 0 ? 0 : 1);
