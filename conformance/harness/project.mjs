// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// A real project, made the way a user makes one: the starter run from its tarball, the
// fixture's files laid over what it wrote, every @assemblejs package installed from its
// tarball, and the build run by the command line the project installed.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// The workspace, wherever the harness is run from.
const workspace = fileURLToPath(new URL("../../", import.meta.url));

const sh = (command, args, cwd) =>
  execFileSync(command, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

/**
 * The third-party packages a renderer needs beside it: each peer that is not ours, at the one
 * version the renderer is tested against, its own dev pin. Read from the workspace, so a fixture
 * names a renderer and never a second copy of a framework's version.
 */
const peersOf = (name) => {
  const manifest = JSON.parse(
    readFileSync(join(workspace, "packages", name, "package.json"), "utf8"),
  );
  return Object.fromEntries(
    Object.keys(manifest.peerDependencies ?? {})
      .filter((peer) => !peer.startsWith("@assemblejs/"))
      .map((peer) => {
        const pin = manifest.devDependencies?.[peer];
        if (pin === undefined) throw new Error(`${name} pins no version of its peer ${peer}`);
        return [peer, pin];
      }),
  );
};

/** Creates, installs and builds a project from `fixture` in `work`, answering its root. */
export function project(fixture, work, tarball, packages) {
  mkdirSync(work, { recursive: true });
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
  // The fixture's own description of what it installs is the harness's, not the project's.
  cpSync(fixture, root, { recursive: true, filter: (from) => basename(from) !== "fixture.json" });
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  manifest.dependencies ??= {};
  manifest.devDependencies ??= {};
  for (const name of packages) {
    const field = name === "cli" ? "devDependencies" : "dependencies";
    manifest[field][`@assemblejs/${name}`] = `file:${tarball(name)}`;
    Object.assign(manifest.dependencies, peersOf(name));
  }
  // One copy of core whoever asks for it, the tarball, never a registry version.
  manifest.overrides = { "@assemblejs/core": `file:${tarball("core")}` };
  writeFileSync(join(root, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  sh("npm", ["install", "--no-audit", "--no-fund"], root);
  sh("npx", ["assemblejs", "build"], root);
  return root;
}
