// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { sourcePaths } from "./source-paths.mjs";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), "academy-source-paths-"));
  roots.push(root);
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "assemblejs.config.ts"), "export default {};");
  return root;
};

test("the supplied file tree lists actual regular source and config, excluding hidden metadata", () => {
  const root = fixture();
  mkdirSync(join(root, "src/views"));
  writeFileSync(join(root, "src/views/b.html"), "<p>Source</p>");
  writeFileSync(join(root, "src/a.ts"), "export default 1;");
  writeFileSync(join(root, "src/.private"), "not indexed");
  writeFileSync(join(root, "package.json"), "not indexed");
  assert.deepEqual(sourcePaths(root), ["assemblejs.config.ts", "src/a.ts", "src/views/b.html"]);
});

test("linked source/config entries and unreadable namespace names refuse instead of escaping", () => {
  for (const kind of ["source", "config", "path"]) {
    const root = fixture();
    writeFileSync(join(root, "target.ts"), "outside the source namespace");
    if (kind === "source") symlinkSync(join(root, "target.ts"), join(root, "src/linked.ts"));
    else if (kind === "config") {
      rmSync(join(root, "assemblejs.config.ts"));
      symlinkSync(join(root, "target.ts"), join(root, "assemblejs.config.ts"));
    } else writeFileSync(join(root, "src", "a".repeat(253)), "too long for source reads");
    assert.throws(() => sourcePaths(root), /refused|namespace/);
  }
});

test("directory streaming stops at the explicit entry bound", () => {
  const root = fixture();
  for (let index = 0; index < 1025; index++)
    writeFileSync(join(root, "src", `entry-${index}.ts`), "");
  assert.throws(() => sourcePaths(root), /1024 entries/);
});
