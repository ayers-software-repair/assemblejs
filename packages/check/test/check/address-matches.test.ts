// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { addressMatches } from "@assemblejs/check";

describe("whether an address is one a route answers", () => {
  it("is when every literal segment is the route's and each parameter has a value", () => {
    expect(addressMatches("/p/:sku", "/p/kettle-1")).toBe(true);
    expect(addressMatches("/shop/:shelf/item/:id", "/shop/beans/item/9")).toBe(true);
    expect(addressMatches("/p/:sku", "/p/kettle-1?grind=fine#top")).toBe(true);
  });

  it("is not for another literal, a parameter with no value, or a different number of segments", () => {
    expect(addressMatches("/p/:sku", "/product/kettle-1")).toBe(false);
    expect(addressMatches("/p/:sku", "/p/")).toBe(false);
    expect(addressMatches("/p/:sku", "/p")).toBe(false);
    expect(addressMatches("/p/:sku", "/p/a/b")).toBe(false);
    expect(addressMatches("/p/:sku", "p/kettle-1")).toBe(false);
    // A backslash is read as a slash by a browser, and so may lead to another host.
    expect(addressMatches("/:a", "/\\elsewhere.example")).toBe(false);
  });
});
