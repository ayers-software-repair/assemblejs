// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createMemoryCache } from "@assemblejs/core";
import type { CachedContent } from "@assemblejs/core";

describe("what the cache holds for one placement", () => {
  it("is the answer, with its version and the assemblies it holds when they were recorded", () => {
    const bare: CachedContent = { html: "<p>a</p>" };
    const whole: CachedContent = {
      html: "<p>b</p>",
      version: "v2",
      holds: [{ name: "balance", view: "default" }],
    };
    // The server's own cache keeps the whole of it: what an answer holds decides who it is for.
    const cache = createMemoryCache(4, () => 0);
    cache.set("bare", bare, 1000);
    cache.set("whole", whole, 1000);
    expect(cache.get("bare")).toEqual(bare);
    expect(cache.get("whole")).toEqual(whole);
  });
});
