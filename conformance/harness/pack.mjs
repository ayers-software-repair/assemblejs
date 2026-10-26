// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Builds the packages and packs each into a tarball, as a publish would write it: pnpm writes a
// real version where the workspace says workspace:*.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

// The workspace, wherever the harness is run from.
const workspace = fileURLToPath(new URL("../../", import.meta.url));

/** Builds and packs the named packages into `into`, answering the tarball of each by name. */
export function pack(names, into) {
  execFileSync("pnpm", [...names.flatMap((name) => ["--filter", `@asmjs/${name}`]), "build"], {
    cwd: workspace,
    stdio: ["ignore", "ignore", "inherit"],
  });
  const packedFiles = new Map();
  for (const name of names) {
    const { filename } = JSON.parse(
      execFileSync("pnpm", ["pack", "--json", "--pack-destination", into], {
        cwd: join(workspace, "packages", name),
        stdio: ["ignore", "pipe", "inherit"],
        encoding: "utf8",
      }),
    );
    const file = join(into, basename(filename));
    if (!existsSync(file)) throw new Error(`no tarball for ${name}`);
    packedFiles.set(name, file);
  }
  return (name) => {
    const file = packedFiles.get(name);
    if (file === undefined) throw new Error(`no tarball for ${name}`);
    return file;
  };
}
