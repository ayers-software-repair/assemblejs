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

  it("keys a placement from another server by its url, never by its local name", () => {
    const a = cacheKey(
      "cart",
      "default",
      new URLSearchParams(),
      "https://a.example.com/assembly/cart/",
    );
    const b = cacheKey(
      "cart",
      "default",
      new URLSearchParams(),
      "https://b.example.com/assembly/cart/",
    );
    expect(a).not.toBe(b);
    expect(a).not.toBe(cacheKey("cart", "default", new URLSearchParams()));
  });

  it("varies on the headers the request carries, whatever order they arrived in", () => {
    const query = new URLSearchParams();
    const url = "https://a.example.com/assembly/cart/";
    const alice = cacheKey("cart", "default", query, url, {
      "x-user": "alice",
      "accept-language": "de",
    });
    expect(alice).toBe(
      cacheKey("cart", "default", query, url, { "accept-language": "de", "x-user": "alice" }),
    );
    expect(alice).not.toBe(
      cacheKey("cart", "default", query, url, { "x-user": "bob", "accept-language": "de" }),
    );
    expect(alice).not.toBe(cacheKey("cart", "default", query, url));
  });

  it("separates two different parameters, in any order, and keeps them apart from the query", () => {
    const query = new URLSearchParams("sku=1");
    const one = cacheKey("cart", "default", query, undefined, {}, { id: "1", page: "2" });
    expect(one).toBe(cacheKey("cart", "default", query, undefined, {}, { page: "2", id: "1" }));
    expect(one).not.toBe(cacheKey("cart", "default", query, undefined, {}, { id: "2", page: "2" }));
    expect(one).not.toBe(cacheKey("cart", "default", query));
    expect(cacheKey("cart", "default", new URLSearchParams("id=1"))).not.toBe(
      cacheKey("cart", "default", new URLSearchParams(), undefined, {}, { id: "1" }),
    );
  });
});
