// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OutsideRootError, insideRoot } from "@assemblejs/cli";

const root = "/home/dev/app";

describe("resolving a path inside the project", () => {
  it("returns the resolved path for something inside", () => {
    expect(insideRoot(root, "src", "assemblies")).toBe("/home/dev/app/src/assemblies");
    expect(insideRoot(root, "src/assemblies/cart/cart.html")).toBe(
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
      expect(() => insideRoot(root, attempt)).toThrow(OutsideRootError);
    }
  });

  it("refuses an absolute path, which would ignore the root entirely", () => {
    expect(() => insideRoot(root, "/etc/passwd")).toThrow(OutsideRootError);
    expect(() => insideRoot(root, "/home/dev/other")).toThrow(OutsideRootError);
  });

  it("refuses a sibling directory whose name merely starts the same", () => {
    // /home/dev/app-other is not inside /home/dev/app, and a prefix comparison would say it is.
    expect(() => insideRoot(root, "../app-other/file")).toThrow(OutsideRootError);
  });

  it("allows a name that merely starts with dots", () => {
    expect(insideRoot(root, "..foo")).toBe("/home/dev/app/..foo");
    expect(insideRoot(root, "a/..b")).toBe("/home/dev/app/a/..b");
  });

  it("allows the root itself", () => {
    expect(insideRoot(root, ".")).toBe("/home/dev/app");
  });

  it("refuses a path that a link inside the root carries outside it", () => {
    const dir = mkdtempSync(join(tmpdir(), "within-link-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    mkdirSync(join(dir, "src"));
    symlinkSync(outside, join(dir, "src", "assemblies"));
    expect(() => insideRoot(dir, "src", "assemblies", "leak", "leak.html")).toThrow(
      OutsideRootError,
    );
    expect(insideRoot(dir, "src", "pages", "home.html")).toBe(
      join(dir, "src", "pages", "home.html"),
    );
  });

  it("refuses a path through a link that points at nothing outside the root", () => {
    const dir = mkdtempSync(join(tmpdir(), "within-dangling-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    symlinkSync(join(outside, "escaped.md"), join(dir, "README.md"));
    symlinkSync(join(outside, "gone"), join(dir, "gone"));
    expect(() => insideRoot(dir, "README.md")).toThrow(OutsideRootError);
    expect(() => insideRoot(dir, "gone", "deeper", "x.html")).toThrow(OutsideRootError);
  });

  it("allows a link that leads somewhere else inside the root, and refuses a loop", () => {
    const dir = mkdtempSync(join(tmpdir(), "within-inner-"));
    mkdirSync(join(dir, "src"));
    symlinkSync(join(dir, "src"), join(dir, "alias"));
    symlinkSync(join(dir, "loop-b"), join(dir, "loop-a"));
    symlinkSync(join(dir, "loop-a"), join(dir, "loop-b"));
    expect(insideRoot(dir, "alias", "x.html")).toBe(join(dir, "alias", "x.html"));
    expect(() => insideRoot(dir, "loop-a", "x.html")).toThrow(OutsideRootError);
  });

  it("works from a root reached through a link, and still refuses what leads out", () => {
    const real = mkdtempSync(join(tmpdir(), "within-real-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    const alias = join(mkdtempSync(join(tmpdir(), "within-alias-")), "app");
    symlinkSync(real, alias);
    symlinkSync(outside, join(real, "out"));
    expect(insideRoot(alias, "src", "x.html")).toBe(join(alias, "src", "x.html"));
    expect(() => insideRoot(alias, "out", "x.html")).toThrow(OutsideRootError);
  });

  it("takes a path that is already whole, and a root given from where it is asked", () => {
    const dir = mkdtempSync(join(tmpdir(), "within-whole-"));
    expect(insideRoot(dir, join(dir, "src", "x.html"))).toBe(join(dir, "src", "x.html"));
    expect(() => insideRoot(dir, join(dir, "..", "x.html"))).toThrow(OutsideRootError);
    expect(insideRoot("app", "src")).toBe(join(process.cwd(), "app", "src"));
  });

  it("says in its refusal what was asked for, and of which root", () => {
    expect(() => insideRoot(root, "../secrets")).toThrow(
      '"../secrets" is outside the project root /home/dev/app',
    );
  });
});
