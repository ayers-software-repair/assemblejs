#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// B-09's proof, end to end, the way a user meets it: the packed tarballs, never workspace links.
//
//   1. pack the starter and what it writes into a project, core, cli and mcp, with pnpm, which
//      writes real versions where the workspace says workspace:*, exactly as a publish would;
//   2. run the starter from its tarball into an empty directory, as `npm create` does;
//   3. point the new project at the tarballs (nothing is published yet) and install it;
//   4. build it with the command line it installed;
//   5. prune every development dependency, so no bundler, no command line and no agent surface
//      is installed;
//   6. start dist/server.js under plain node and fetch the page it composes.
//
// It needs the network for the third-party dependencies, and minutes, so it is a proof run on
// demand (`pnpm proof:create`) rather than a gate in `pnpm check`.
import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { pack } from "../conformance/harness/pack.mjs";

const step = (text) => console.log(`\n== ${text}`);
const sh = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

const scaffold = (root) =>
  Object.fromEntries(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const file = join(entry.parentPath, entry.name);
        return [relative(root, file), readFileSync(file)];
      }),
  );

const work = mkdtempSync(join(tmpdir(), "assemblejs-proof-"));
const tarballs = join(work, "tarballs");

// The starter, and every package of ours it writes into a project.
const packed = ["create-assemblejs", "create", "core", "build", "check", "cli", "mcp"];
step(`build and pack ${packed.join(", ")}, so the tarballs are the source at this commit`);
const tarball = pack(packed, tarballs);
console.log(readdirSync(tarballs).join("\n"));

step("compare the packed scoped starter and unscoped wrapper");
const setup = join(work, "starter");
mkdirSync(setup);
const internal = ["create", "cli", "check", "build", "core"];
const archives = Object.fromEntries(
  internal.map((name) => [`@asmjs/${name}`, `file:${tarball(name)}`]),
);
writeFileSync(
  join(setup, "package.json"),
  JSON.stringify({
    private: true,
    dependencies: { ...archives, "create-assemblejs": `file:${tarball("create-assemblejs")}` },
    overrides: archives,
  }),
);
sh("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], setup);
const entry = (name) => join(setup, "node_modules", name, "dist", "bin.js");
const scoped = join(work, "scoped", "my-app");
const unscoped = join(work, "unscoped", "my-app");
mkdirSync(join(work, "scoped"));
mkdirSync(join(work, "unscoped"));
sh(process.execPath, [entry("@asmjs/create"), "my-app"], join(work, "scoped"));
sh(process.execPath, [entry("create-assemblejs"), "my-app"], join(work, "unscoped"));
assert.deepEqual(scaffold(unscoped), scaffold(scoped));
for (const name of ["@asmjs/create", "create-assemblejs"]) {
  const invalid = spawnSync(process.execPath, [entry(name), "--bad"], {
    cwd: setup,
    encoding: "utf8",
  });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /usage:/);
}
const app = unscoped;

step("install the project against the tarballs");
const manifest = JSON.parse(readFileSync(join(app, "package.json"), "utf8"));
// Each package is pointed at its tarball where the starter put it, never moved: whether the
// command line and the agent surface are development dependencies is part of what this proves.
for (const field of ["dependencies", "devDependencies"]) {
  for (const name of packed) {
    if (manifest[field]?.[`@asmjs/${name}`] !== undefined) {
      manifest[field][`@asmjs/${name}`] = `file:${tarball(name)}`;
    }
  }
}
// One copy of core, the build, the checks and the command line, whoever asks: the tarball.
manifest.overrides = Object.fromEntries(
  ["core", "build", "check", "cli"].map((name) => [`@asmjs/${name}`, `file:${tarball(name)}`]),
);
writeFileSync(join(app, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
sh("npm", ["install", "--no-audit", "--no-fund"], app);

step("build with the command line the project installed");
console.log(sh("npx", ["assemblejs", "build"], app).trim());

step("prune every development dependency");
sh("npm", ["prune", "--omit=dev", "--no-audit", "--no-fund"], app);
for (const gone of ["esbuild", "@asmjs/build", "@asmjs/check", "@asmjs/cli", "@asmjs/mcp"]) {
  if (existsSync(join(app, "node_modules", gone))) throw new Error(`${gone} is still installed`);
  console.log(`${gone}: not installed`);
}

step("node dist/server.js, and the page it serves");
const port = String(20000 + Math.floor(Math.random() * 20000));
const server = spawn(process.execPath, ["dist/server.js"], {
  cwd: app,
  env: { ...process.env, ASSEMBLEJS_PORT: port },
  stdio: ["ignore", "pipe", "inherit"],
});
try {
  const origin = await new Promise((resolve, reject) => {
    setTimeout(
      () => reject(new Error("dist/server.js did not say it was listening within 30s")),
      30_000,
    );
    server.stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
      const found = /listening (http:\/\/\S+)/.exec(String(chunk));
      if (found) resolve(found[1]);
    });
    server.on("exit", (code) => reject(new Error(`dist/server.js exited with ${code}`)));
  });
  const page = await (await fetch(`${origin}/`)).text();
  console.log(page);
  for (const expected of ["<assembly-root", 'data-name="hello"', "Hello from AssembleJS"]) {
    if (!page.includes(expected)) throw new Error(`the page does not contain ${expected}`);
  }
  console.log("\nproof: created from the tarball, built, and served with no bundler installed");
} finally {
  server.kill();
}
