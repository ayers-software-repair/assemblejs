// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { suggestName } from "@asmjs/build";

describe("the usable name nearest to one that is not", () => {
  it("lowers the case and joins the words with hyphens", () => {
    expect(suggestName("Cart", "assembly")).toBe("cart");
    expect(suggestName("Cart Item", "assembly")).toBe("cart-item");
    expect(suggestName("cartItem", "assembly")).toBe("cart-item");
    expect(suggestName("cart_item!!", "assembly")).toBe("cart-item");
  });

  it("starts with a letter", () => {
    expect(suggestName("1cart", "assembly")).toBe("cart");
    expect(suggestName("../etc", "assembly")).toBe("etc");
  });

  // A project was told to call itself an assembly, and so was a page.
  it("is the caller's own example where the name holds nothing usable", () => {
    expect(suggestName("123", "assembly")).toBe("assembly");
    expect(suggestName(".", "my-app")).toBe("my-app");
    expect(suggestName("___", "page")).toBe("page");
  });
});
