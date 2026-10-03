// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { suggestName } from "@assemblejs/cli";

describe("the usable name nearest to one that is not", () => {
  it("lowers the case and joins the words with hyphens", () => {
    expect(suggestName("Cart")).toBe("cart");
    expect(suggestName("Cart Item")).toBe("cart-item");
    expect(suggestName("cartItem")).toBe("cart-item");
    expect(suggestName("cart_item!!")).toBe("cart-item");
  });

  it("starts with a letter, and is never empty", () => {
    expect(suggestName("1cart")).toBe("cart");
    expect(suggestName("../etc")).toBe("etc");
    expect(suggestName("123")).toBe("assembly");
  });
});
