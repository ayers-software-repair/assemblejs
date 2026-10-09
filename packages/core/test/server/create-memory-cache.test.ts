// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createMemoryCache } from "@assemblejs/core";

describe("the cache a server holds placements in", () => {
  it("answers an entry until its lifetime passes, then forgets it", () => {
    let now = 0;
    const cache = createMemoryCache(10, () => now);
    cache.set("cart/default", { html: "<p>a</p>", version: "v1" }, 100);
    now = 99;
    expect(cache.get("cart/default")).toEqual({ html: "<p>a</p>", version: "v1" });
    now = 100;
    expect(cache.get("cart/default")).toBeUndefined();
  });

  it("drops the oldest once it holds its capacity", () => {
    const cache = createMemoryCache(2, () => 0);
    cache.set("a", { html: "a" }, 1000);
    cache.set("b", { html: "b" }, 1000);
    cache.set("c", { html: "c" }, 1000);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toEqual({ html: "c" });
  });
});
