// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// A real project, made the way a user makes one: the starter run from its tarball, the
// fixture's files laid over what it wrote, every @assemblejs package installed from its
// tarball, and the build run by the command line the project installed.
import { cpSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const sh = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

/** Creates, installs and builds a project from `fixture` in `work`, answering its root. */
export function project(fixture, work, tarball, packages) {
  sh(
    "npm",
    [
      "exec",
      "--yes",
      ...["create", "cli", "core"].map((name) => `--package=${tarball(name)}`),
      "--",
      "create-assemblejs",
      "app",
    ],
    work,
  );
  const root = join(work, "app");
  cpSync(fixture, root, { recursive: true });
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  manifest.dependencies ??= {};
  for (const name of packages) {
    const field = name === "cli" ? "devDependencies" : "dependencies";
    manifest[field] ??= {};
    manifest[field][`@assemblejs/${name}`] = `file:${tarball(name)}`;
  }
  // One copy of core whoever asks for it, the tarball, never a registry version.
  manifest.overrides = { "@assemblejs/core": `file:${tarball("core")}` };
  writeFileSync(join(root, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  sh("npm", ["install", "--no-audit", "--no-fund"], root);
  sh("npx", ["assemblejs", "build"], root);
  return root;
}
