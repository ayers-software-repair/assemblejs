// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { realIo } from "@asmjs/build";

let root = "";
afterEach(() => {
  if (root !== "") rmSync(root, { recursive: true, force: true });
});

describe("the io a command gets when it is actually run", () => {
  it("removes a file it wrote, and is quiet about one that is not there", () => {
    const dir = mkdtempSync(join(tmpdir(), "real-io-"));
    const file = join(dir, "gone.txt");
    realIo.write(file, "x");
    realIo.remove(file);
    expect(existsSync(file)).toBe(false);
    expect(() => realIo.remove(file)).not.toThrow();
  });

  it("creates the directories a path needs", () => {
    root = mkdtempSync(join(tmpdir(), "assemblejs-io-"));
    const path = join(root, "deep", "nested", "file.txt");
    realIo.write(path, "contents");
    expect(readFileSync(path, "utf8")).toBe("contents");
    expect(realIo.exists(path)).toBe(true);
    expect(realIo.exists(join(root, "nothing"))).toBe(false);
  });
});
