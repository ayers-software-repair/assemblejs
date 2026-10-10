// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { findPlacements } from "@assemblejs/core";
import { placementDirective } from "@assemblejs/core/client";

describe("the directive that places an assembly, as markup", () => {
  it("names the assembly, and its view when one is asked for", () => {
    expect(placementDirective("cart")).toBe('<assembly name="cart"></assembly>');
    expect(placementDirective("price", "compact")).toBe(
      '<assembly name="price" view="compact"></assembly>',
    );
  });

  it("is exactly what the composer reads as that one placement", () => {
    expect(findPlacements(`<section>${placementDirective("cart")}</section>`)).toMatchObject([
      { name: "cart", view: "default" },
    ]);
    expect(findPlacements(placementDirective("price-2", "wide"))).toMatchObject([
      { name: "price-2", view: "wide" },
    ]);
  });

  // It is written into a view raw, so it is built from segments alone.
  it("throws for a name or a view that is not a segment, rather than write it as markup", () => {
    for (const bad of ['x"><script>alert(1)</script>', "Cart", "a/b", "../x", "", "cart name"]) {
      expect(() => placementDirective(bad), bad).toThrow(/name ".*" is not a usable url segment/s);
      expect(() => placementDirective("cart", bad), bad).toThrow(/view ".*" is not a usable/s);
    }
  });
});
