// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { moduleHashes } from "./module-hashes.mjs";

const digest = (text) => createHash("sha256").update(text).digest("hex");
test("inventories real entry and split-module bytes while refusing symlinks and missing entries", async () => {
  const dir = await mkdtemp(join(tmpdir(), "framework-modules-"));
  try {
    await mkdir(join(dir, "chunks"));
    await writeFile(join(dir, "index.js"), "entry");
    await writeFile(join(dir, "index.d.ts"), "types");
    await writeFile(join(dir, "chunks/shared.js"), "split");
    assert.deepEqual(await moduleHashes(dir), {
      "index.js": digest("entry"),
      "chunks/shared.js": digest("split"),
    });
    await symlink(join(dir, "index.js"), join(dir, "alias.js"));
    await assert.rejects(moduleHashes(dir), /symlinks/);
    await rm(join(dir, "alias.js"));
    await rm(join(dir, "index.js"));
    await assert.rejects(moduleHashes(dir), /actual JavaScript entry/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
