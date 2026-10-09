// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The version of the package a module belongs to, read from that package's own package.json,
 * the one place a version is written. The caller passes its `import.meta.url`; the manifest is
 * found by walking up from there, so the answer is the same from `src/<dir>/` and from the flat
 * `dist/` a build produces, and the same function serves every package that imports it.
 */
export function ownVersion(moduleUrl: string): string {
  let dir = dirname(fileURLToPath(moduleUrl));
  while (!existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`no package.json above ${fileURLToPath(moduleUrl)}`);
    dir = parent;
  }
  const { version } = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
    version?: unknown;
  };
  if (typeof version !== "string") throw new Error(`${join(dir, "package.json")} has no version`);
  return version;
}
