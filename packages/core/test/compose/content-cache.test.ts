// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { compose } from "@asmjs/core";
import type { ContentCache, Fetch } from "@asmjs/core";

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

  it("fails only the placement whose read of it threw, which stands marked with the id its cause is logged against", async () => {
    const broken: ContentCache = {
      get: () => {
        throw new Error("the cache broke");
      },
      set: () => undefined,
    };
    const fetch: Fetch = async (request) => ({
      ok: true,
      html: `<p>${request.name}</p>`,
      source: "local",
    });
    const plan = {
      cart: { name: "cart", view: "default", deadline: 3000, cache: { ttl: 60_000 } },
    };
    const result = await compose({
      template: '<main><assembly name="cart"/><assembly name="ok"/></main>',
      plan,
      fetch,
      cache: broken,
      page: "p1",
      newId: () => "c-7",
      now: () => 0,
    });
    expect(result.html).toMatch(/<main><assembly-root data-name="cart" [^>]*data-failed="c-7">/);
    expect(result.html).toContain("<p>ok</p>");
    expect(result.diagnostics).toMatchObject([
      {
        name: "cart",
        source: "fallback",
        reason: "invalid",
        correlationId: "c-7",
        cause: "the cache broke",
      },
      { name: "ok", source: "local" },
    ]);
  });
});
