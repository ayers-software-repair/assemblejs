// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { insideDirectory } from "@assemblejs/cli";

describe("whether a file really lies inside a directory", () => {
  it("follows every link, and reads a name starting with dots as a name", () => {
    const root = mkdtempSync(join(tmpdir(), "inside-"));
    const directory = join(root, "cart");
    mkdirSync(join(directory, "img"), { recursive: true });
    writeFileSync(join(directory, "img", "a.png"), "");
    writeFileSync(join(directory, "..b.png"), "");
    writeFileSync(join(root, "out.png"), "");
    symlinkSync(join(root, "out.png"), join(directory, "link.png"));
    expect(insideDirectory(directory, join(directory, "img", "a.png"))).toBe(true);
    expect(insideDirectory(directory, join(directory, "..b.png"))).toBe(true);
    expect(insideDirectory(directory, join(root, "out.png"))).toBe(false);
    expect(insideDirectory(directory, join(directory, "link.png"))).toBe(false);
    expect(insideDirectory(directory, directory)).toBe(false);
  });
});
