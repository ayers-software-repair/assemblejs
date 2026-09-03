// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { cacheKey } from "@assemblejs/core";

describe("the cache key", () => {
  it("is the identity when there is no query", () => {
    expect(cacheKey("cart", "default", new URLSearchParams())).toBe("cart/default");
  });

  it("does not depend on the order the query was written in", () => {
    const one = cacheKey("cart", "default", new URLSearchParams("b=2&a=1"));
    const two = cacheKey("cart", "default", new URLSearchParams("a=1&b=2"));
    expect(one).toBe(two);
  });

  it("separates two different queries, because they are two different pages", () => {
    expect(cacheKey("cart", "default", new URLSearchParams("sku=1"))).not.toBe(
      cacheKey("cart", "default", new URLSearchParams("sku=2")),
    );
  });
});
