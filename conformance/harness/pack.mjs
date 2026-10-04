// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Builds the packages and packs each into a tarball, as a publish would write it: pnpm writes a
// real version where the workspace says workspace:*.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The workspace, wherever the harness is run from.
const workspace = fileURLToPath(new URL("../../", import.meta.url));

/** Builds and packs the named packages into `into`, answering the tarball of each by name. */
export function pack(names, into) {
  execFileSync("pnpm", [...names.flatMap((name) => ["--filter", `@assemblejs/${name}`]), "build"], {
    cwd: workspace,
    stdio: ["ignore", "ignore", "inherit"],
  });
  for (const name of names) {
    execFileSync("pnpm", ["pack", "--pack-destination", into], {
      cwd: join(workspace, "packages", name),
      stdio: ["ignore", "ignore", "inherit"],
    });
  }
  return (name) => {
    const file = readdirSync(into).find((entry) => entry.startsWith(`assemblejs-${name}-`));
    if (file === undefined) throw new Error(`no tarball for ${name}`);
    return join(into, file);
  };
}
