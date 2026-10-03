// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { planAssembly } from "@assemblejs/cli";

describe("what adding an assembly would write", () => {
  it("is its view and the tag that places it", () => {
    const plan = planAssembly("cart", "svelte", false);
    expect(plan).toEqual({
      files: { "src/assemblies/cart/cart.svelte": expect.any(String) },
      tag: '<assembly name="cart"></assembly>',
    });
  });

  it("refuses a name with the name that would work", () => {
    const plan = planAssembly("Cart Item", "html", false);
    expect(plan).toMatchObject({
      usage: true,
      problem: { rule: "directory-is-an-assembly", fix: 'call it "cart-item"' },
    });
  });

  it("refuses a renderer it cannot build, naming the ones it can", () => {
    expect(planAssembly("cart", "angular", false)).toMatchObject({
      usage: true,
      problem: { rule: "a-view-needs-its-renderer", fix: "use one of: html, react, svelte" },
    });
  });

  it("refuses an assembly that exists, which is not a usage mistake", () => {
    expect(planAssembly("cart", "html", true)).toMatchObject({
      usage: false,
      problem: { message: 'assembly "cart" already exists' },
    });
  });
});
