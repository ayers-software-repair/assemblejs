// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { sourceFilePath } from "../../src/author/source-file-path.js";
import { resolveRoot } from "../../src/root/resolve-root.js";

let dir = "";
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "source-path-"));
  mkdirSync(join(dir, "src"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

it("resolves source and config without creating absent directories", () => {
  const root = resolveRoot(dir);
  writeFileSync(join(dir, "assemblejs.config.ts"), "export default {};");
  expect(sourceFilePath(root, "assemblejs.config.ts")).toBe(join(dir, "assemblejs.config.ts"));
  expect(sourceFilePath(root, "src/new/view.tsx")).toBe(join(dir, "src/new/view.tsx"));
  expect(existsSync(join(dir, "src/new"))).toBe(false);
});

it.each([
  "../outside",
  "/tmp/outside",
  "package.json",
  "pnpm-lock.yaml",
  "dist/server.js",
  "src/../package.json",
  "src/.env",
  "src/.hidden/a.ts",
  "src/a//b.ts",
  "src\\a.ts",
  "src/a.ts\0x",
  "src/a:b.ts",
])("refuses metadata or unconfined path %s", (path) => {
  expect(() => sourceFilePath(resolveRoot(dir), path)).toThrow();
});

it("refuses directories as files and regular files as directories", () => {
  writeFileSync(join(dir, "src/leaf.ts"), "old");
  expect(() => sourceFilePath(resolveRoot(dir), "src")).toThrow();
  expect(() => sourceFilePath(resolveRoot(dir), "src/leaf.ts/child.ts")).toThrow();
});

it("refuses inward, outward and broken links before opening their targets", () => {
  writeFileSync(join(dir, "src/real.ts"), "inside");
  symlinkSync(join(dir, "src/real.ts"), join(dir, "src/linked.ts"));
  symlinkSync(dir, join(dir, "src/linked-dir"), "dir");
  symlinkSync(join(dir, "missing"), join(dir, "src/broken.ts"));
  symlinkSync(tmpdir(), join(dir, "src/outside"), "dir");
  for (const path of [
    "src/linked.ts",
    "src/linked-dir/src/real.ts",
    "src/broken.ts",
    "src/outside/secret.ts",
  ])
    expect(() => sourceFilePath(resolveRoot(dir), path)).toThrow();
});
