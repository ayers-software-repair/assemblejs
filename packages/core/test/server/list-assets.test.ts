// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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
});
