// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isOccupied } from "@assemblejs/mcp";

describe("whether anything is at a path", () => {
  it("counts a file, and a link that points at nothing, and not an empty place", () => {
    const dir = mkdtempSync(join(tmpdir(), "occupied-"));
    writeFileSync(join(dir, "file"), "");
    symlinkSync(join(dir, "nowhere"), join(dir, "dangling"));
    expect(isOccupied(join(dir, "file"))).toBe(true);
    expect(isOccupied(join(dir, "dangling"))).toBe(true);
    expect(isOccupied(join(dir, "free"))).toBe(false);
  });
});
