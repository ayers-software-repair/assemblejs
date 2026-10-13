// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * What the manifest of the package a module belongs to says of it that the command line writes
 * into a project, its version and the versions of its tools, read from that package's own
 * package.json, the one place they are written. The caller passes its
 * `import.meta.url`; the manifest is found by walking up from there, so the answer is the same
 * from `src/<dir>/` and from the flat `dist/` a build produces.
 */
export function ownManifest(moduleUrl: string): {
  readonly version: string;
  readonly devDependencies: Readonly<Record<string, string>>;
} {
  let dir = dirname(fileURLToPath(moduleUrl));
  while (!existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`no package.json above ${fileURLToPath(moduleUrl)}`);
    dir = parent;
  }
  const manifest = join(dir, "package.json");
  const { version, devDependencies } = JSON.parse(readFileSync(manifest, "utf8")) as {
    version?: unknown;
    devDependencies?: unknown;
  };
  if (typeof version !== "string") throw new Error(`${manifest} has no version`);
  const pins: Record<string, string> = {};
  if (typeof devDependencies === "object" && devDependencies !== null) {
    for (const [name, range] of Object.entries(devDependencies)) {
      if (typeof range === "string") pins[name] = range;
    }
  }
  return { version, devDependencies: pins };
}
