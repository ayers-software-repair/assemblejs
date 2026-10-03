// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listAssets } from "@assemblejs/core";

describe("listing a build's browser files", () => {
  it("keys every file, nested or not, by the url it is served at", () => {
    const root = mkdtempSync(join(tmpdir(), "assets-"));
    mkdirSync(join(root, "chunks"));
    writeFileSync(join(root, "client-1a2b.js"), "");
    writeFileSync(join(root, "chunks", "hello-3c4d.js"), "");
    const files = listAssets(root);
    expect([...files.keys()].sort()).toEqual([
      "/_assemblejs/assets/chunks/hello-3c4d.js",
      "/_assemblejs/assets/client-1a2b.js",
    ]);
    expect(files.get("/_assemblejs/assets/client-1a2b.js")).toBe(join(root, "client-1a2b.js"));
  });

  it("lists no symbolic link, which could point anywhere", () => {
    const root = mkdtempSync(join(tmpdir(), "assets-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    writeFileSync(join(outside, "secret.txt"), "hunter2");
    symlinkSync(join(outside, "secret.txt"), join(root, "link.js"));
    symlinkSync(outside, join(root, "linked"));
    expect([...listAssets(root).keys()]).toEqual([]);
  });

  it("keys a name a browser percent-encodes by its encoded form", () => {
    const root = mkdtempSync(join(tmpdir(), "assets-"));
    writeFileSync(join(root, "s p.js"), "");
    expect([...listAssets(root).keys()]).toEqual(["/_assemblejs/assets/s%20p.js"]);
  });
});
