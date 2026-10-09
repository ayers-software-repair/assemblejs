// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isDirectory } from "@assemblejs/cli";

describe("whether a path is a directory now", () => {
  it("is true for a directory and false for a file", () => {
    const root = mkdtempSync(join(tmpdir(), "is-dir-"));
    writeFileSync(join(root, "a.txt"), "");
    expect(isDirectory(root)).toBe(true);
    expect(isDirectory(join(root, "a.txt"))).toBe(false);
  });

  it("is false, never a throw, for a dangling link or a path that is gone", () => {
    const root = mkdtempSync(join(tmpdir(), "is-dir-"));
    symlinkSync(join(root, "nowhere"), join(root, "dangling"));
    expect(isDirectory(join(root, "dangling"))).toBe(false);
    expect(isDirectory(join(root, "gone"))).toBe(false);
  });
});
