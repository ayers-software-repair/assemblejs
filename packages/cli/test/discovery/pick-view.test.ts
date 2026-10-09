// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { pickView } from "@assemblejs/cli";

describe("picking an assembly's view from its view files", () => {
  it("takes the only one, whatever it is named", () => {
    expect(pickView("cart", ["basket.svelte"])).toBe("basket.svelte");
  });

  it("takes the one named after the assembly, its components beside it", () => {
    expect(pickView("cart", ["cart-row.svelte", "cart.svelte"])).toBe("cart.svelte");
    expect(pickView("cart", ["cart.lit.ts", "price.lit.ts"])).toBe("cart.lit.ts");
    expect(pickView("cart", ["cart.react.tsx", "row.react.tsx"])).toBe("cart.react.tsx");
    expect(pickView("cart", ["cart.md", "notes.md"])).toBe("cart.md");
  });

  it("decides nothing when another framework is among them", () => {
    expect(pickView("cart", ["cart.svelte", "cart.vue"])).toBeUndefined();
    expect(pickView("cart", ["cart.svelte", "row.vue"])).toBeUndefined();
    expect(pickView("cart", ["cart.react.tsx", "row.preact.tsx"])).toBeUndefined();
  });

  it("decides nothing unless exactly one file is named after it, not merely starting with its name", () => {
    expect(pickView("cart", ["a.svelte", "b.svelte"])).toBeUndefined();
    expect(pickView("cart", ["cart.lit.js", "cart.lit.ts"])).toBeUndefined();
    expect(pickView("cart", ["cart.row.svelte", "cart.list.svelte"])).toBeUndefined();
    expect(pickView("cart", ["cart.row.svelte", "item.svelte"])).toBeUndefined();
    expect(pickView("cart", ["carts.svelte", "item.svelte"])).toBeUndefined();
  });
});
