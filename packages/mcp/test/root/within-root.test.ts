// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OutsideRootError, resolveRoot, withinRoot } from "@assemblejs/mcp";

const root = resolveRoot("/home/dev/app");

describe("resolving a path inside the project", () => {
  it("returns the resolved path for something inside", () => {
    expect(withinRoot(root, "src", "assemblies")).toBe("/home/dev/app/src/assemblies");
    expect(withinRoot(root, "src/assemblies/cart/cart.html")).toBe(
      "/home/dev/app/src/assemblies/cart/cart.html",
    );
  });

  // The comparison is on the RESOLVED path, not the given one, so a traversal is settled before
  // the check rather than after it. A guard that inspects the argument is one that "a/../.." walks
  // straight past.
  it("refuses a traversal, however it is spelled", () => {
    for (const attempt of [
      "..",
      "../secrets",
      "../../etc/passwd",
      "src/../../outside",
      "src/assemblies/../../../etc/shadow",
    ]) {
      expect(() => withinRoot(root, attempt)).toThrow(OutsideRootError);
    }
  });

  it("refuses an absolute path, which would ignore the root entirely", () => {
    expect(() => withinRoot(root, "/etc/passwd")).toThrow(OutsideRootError);
    expect(() => withinRoot(root, "/home/dev/other")).toThrow(OutsideRootError);
  });

  it("refuses a sibling directory whose name merely starts the same", () => {
    // /home/dev/app-other is not inside /home/dev/app, and a prefix comparison would say it is.
    expect(() => withinRoot(root, "../app-other/file")).toThrow(OutsideRootError);
  });

  it("allows a name that merely starts with dots", () => {
    expect(withinRoot(root, "..foo")).toBe("/home/dev/app/..foo");
    expect(withinRoot(root, "a/..b")).toBe("/home/dev/app/a/..b");
  });

  it("allows the root itself", () => {
    expect(withinRoot(root, ".")).toBe("/home/dev/app");
  });

  it("refuses a path that a link inside the root carries outside it", () => {
    const dir = mkdtempSync(join(tmpdir(), "within-link-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    mkdirSync(join(dir, "src"));
    symlinkSync(outside, join(dir, "src", "assemblies"));
    const real = resolveRoot(dir);
    expect(() => withinRoot(real, "src", "assemblies", "leak", "leak.html")).toThrow(
      OutsideRootError,
    );
    expect(withinRoot(real, "src", "pages", "home.html")).toBe(
      join(dir, "src", "pages", "home.html"),
    );
  });

  it("refuses a path through a link that points at nothing outside the root", () => {
    const dir = mkdtempSync(join(tmpdir(), "within-dangling-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    symlinkSync(join(outside, "escaped.md"), join(dir, "README.md"));
    symlinkSync(join(outside, "gone"), join(dir, "gone"));
    const real = resolveRoot(dir);
    expect(() => withinRoot(real, "README.md")).toThrow(OutsideRootError);
    expect(() => withinRoot(real, "gone", "deeper", "x.html")).toThrow(OutsideRootError);
  });

  it("allows a link that leads somewhere else inside the root, and refuses a loop", () => {
    const dir = mkdtempSync(join(tmpdir(), "within-inner-"));
    mkdirSync(join(dir, "src"));
    symlinkSync(join(dir, "src"), join(dir, "alias"));
    symlinkSync(join(dir, "loop-b"), join(dir, "loop-a"));
    symlinkSync(join(dir, "loop-a"), join(dir, "loop-b"));
    const real = resolveRoot(dir);
    expect(withinRoot(real, "alias", "x.html")).toBe(join(dir, "alias", "x.html"));
    expect(() => withinRoot(real, "loop-a", "x.html")).toThrow(OutsideRootError);
  });

  it("works from a root reached through a link, and still refuses what leads out", () => {
    const real = mkdtempSync(join(tmpdir(), "within-real-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    const alias = join(mkdtempSync(join(tmpdir(), "within-alias-")), "app");
    symlinkSync(real, alias);
    symlinkSync(outside, join(real, "out"));
    const root = resolveRoot(alias);
    expect(withinRoot(root, "src", "x.html")).toBe(join(alias, "src", "x.html"));
    expect(() => withinRoot(root, "out", "x.html")).toThrow(OutsideRootError);
  });
});
