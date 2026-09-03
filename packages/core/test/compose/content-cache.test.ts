// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ContentCache } from "@assemblejs/core";

describe("the content cache", () => {
  it("is a shape anything that stores bytes can satisfy", () => {
    const store = new Map<string, { html: string; version?: string }>();
    const cache: ContentCache = {
      get: (key) => store.get(key),
      set: (key, value) => void store.set(key, { html: value.html }),
    };
    cache.set("assembly:cart#default", { html: "<p>cart</p>" }, 60_000);
    expect(cache.get("assembly:cart#default")?.html).toBe("<p>cart</p>");
    expect(cache.get("assembly:missing")).toBeUndefined();
  });
});
