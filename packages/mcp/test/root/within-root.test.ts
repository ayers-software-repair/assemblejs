// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OutsideRootError } from "@assemblejs/cli";
import { describe, expect, it } from "vitest";
import { resolveRoot, withinRoot } from "@assemblejs/mcp";

// The rule itself is the command line's, and held there. Here: that a tool's guard is that rule,
// asked of the root the server was started on.
describe("resolving a path inside the project a server works on", () => {
  it("returns the resolved path for something inside", () => {
    const root = resolveRoot("/home/dev/app");
    expect(withinRoot(root, "src", "assemblies")).toBe("/home/dev/app/src/assemblies");
    expect(withinRoot(root, ".")).toBe("/home/dev/app");
  });

  it("refuses a traversal and an absolute path, as the command line's readers do", () => {
    const root = resolveRoot("/home/dev/app");
    for (const attempt of ["..", "src/../../outside", "/etc/passwd", "../app-other/file"]) {
      expect(() => withinRoot(root, attempt), attempt).toThrow(OutsideRootError);
    }
  });

  it("refuses a path that a link inside the root carries outside it", () => {
    const dir = mkdtempSync(join(tmpdir(), "within-link-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    mkdirSync(join(dir, "src"));
    symlinkSync(outside, join(dir, "src", "assemblies"));
    const root = resolveRoot(dir);
    expect(() => withinRoot(root, "src", "assemblies", "leak", "leak.html")).toThrow(
      OutsideRootError,
    );
    expect(withinRoot(root, "src", "pages", "home.html")).toBe(
      join(dir, "src", "pages", "home.html"),
    );
  });
});
