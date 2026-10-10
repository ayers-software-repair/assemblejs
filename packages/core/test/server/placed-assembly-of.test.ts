// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineAssembly, placedAssemblyOf } from "@assemblejs/core";

const markup = (): string => "";

describe("what the placement rules read of a declared assembly", () => {
  it("is its views, and what each view's source is known to place", () => {
    const shell = defineAssembly({
      name: "shell",
      views: {
        default: { renderer: "html", markup, placements: [{ name: "cart" }] },
        compact: { renderer: "html", markup },
      },
    });
    expect(placedAssemblyOf(shell)).toEqual({
      views: ["default", "compact"],
      browserHalf: false,
      placements: { default: [{ name: "cart" }] },
    });
  });

  it("says nothing of placements for an assembly whose sources nobody read", () => {
    const plain = defineAssembly({
      name: "plain",
      views: { default: { renderer: "html", markup } },
    });
    expect(placedAssemblyOf(plain)).toEqual({ views: ["default"], browserHalf: false });
  });

  it("has a browser half when it links a module and mounts it", () => {
    const views = { default: { renderer: "react", markup } };
    const assets = { css: [], js: ["/client.js"] };
    expect(placedAssemblyOf({ name: "live", views, assets }).browserHalf).toBe(true);
    expect(placedAssemblyOf({ name: "still", views, assets, mount: "none" }).browserHalf).toBe(
      false,
    );
    expect(
      placedAssemblyOf({ name: "bare", views, assets: { css: ["/a.css"], js: [] } }).browserHalf,
    ).toBe(false);
  });
});
