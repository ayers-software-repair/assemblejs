#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// B-09's proof, end to end, the way a user meets it: the packed tarballs, never workspace links.
//
//   1. pack core, cli and create with pnpm, which writes real versions where the workspace says
//      workspace:*, exactly as a publish would;
//   2. run the starter from its tarball into an empty directory, as `npm create` does;
//   3. point the new project at the tarballs (nothing is published yet) and install it;
//   4. build it with the command line it installed;
//   5. prune every development dependency, so no bundler and no command line is installed;
//   6. start dist/server.js under plain node and fetch the page it composes.
//
// It needs the network for the third-party dependencies, and minutes, so it is a proof run on
// demand (`pnpm proof:create`) rather than a gate in `pnpm check`.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const step = (text) => console.log(`\n== ${text}`);
const sh = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

const work = mkdtempSync(join(tmpdir(), "assemblejs-proof-"));
const tarballs = join(work, "tarballs");

step("pack core, cli and create");
for (const name of ["core", "cli", "create"]) {
  sh("pnpm", ["pack", "--pack-destination", tarballs], join("packages", name));
}
const tarball = (name) => {
  const file = readdirSync(tarballs).find((entry) => entry.startsWith(`assemblejs-${name}-`));
  if (file === undefined) throw new Error(`no tarball for ${name}`);
  return join(tarballs, file);
};
console.log(readdirSync(tarballs).join("\n"));

step("npm create, from the starter's tarball, into an empty directory");
// Its dependencies are handed over as tarballs too, because none of them is published yet.
sh(
  "npm",
  [
    "exec",
    "--yes",
    ...["create", "cli", "core"].map((name) => `--package=${tarball(name)}`),
    "--",
    "create-assemblejs",
    "my-app",
  ],
  work,
);
const app = join(work, "my-app");

step("install the project against the tarballs");
const manifest = JSON.parse(readFileSync(join(app, "package.json"), "utf8"));
// Each package is pointed at its tarball where the starter put it, never moved: whether the
// command line is a development dependency is part of what this proves.
for (const field of ["dependencies", "devDependencies"]) {
  for (const name of ["core", "cli"]) {
    if (manifest[field]?.[`@assemblejs/${name}`] !== undefined) {
      manifest[field][`@assemblejs/${name}`] = `file:${tarball(name)}`;
    }
  }
}
manifest.overrides = { "@assemblejs/core": `file:${tarball("core")}` };
writeFileSync(join(app, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
sh("npm", ["install", "--no-audit", "--no-fund"], app);

step("build with the command line the project installed");
console.log(sh("npx", ["assemblejs", "build"], app).trim());

step("prune every development dependency");
sh("npm", ["prune", "--omit=dev", "--no-audit", "--no-fund"], app);
for (const gone of ["esbuild", "@assemblejs/cli"]) {
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
