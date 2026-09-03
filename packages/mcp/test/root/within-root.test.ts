// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
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

  it("allows the root itself", () => {
    expect(withinRoot(root, ".")).toBe("/home/dev/app");
  });
});
