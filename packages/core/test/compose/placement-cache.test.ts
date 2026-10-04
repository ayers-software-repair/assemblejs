// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { placementCache } from "@assemblejs/core";
import type { AssemblyPlan, ContentCache, SettleInput } from "@assemblejs/core";

const memory = (): ContentCache & { store: Map<string, string> } => {
  const store = new Map<string, string>();
  return {
    store,
    get: (key) => {
      const html = store.get(key);
      return html === undefined ? undefined : { html };
    },
    set: (key, value) => void store.set(key, value.html),
  };
};

const input = (
  cache: ContentCache,
  plan: Partial<AssemblyPlan>,
  headers: Record<string, string> = {},
): SettleInput => ({
  name: "cart",
  view: "default",
  plan: { name: "cart", view: "default", deadline: 3000, ...plan },
  fetch: async () => ({ ok: true, html: "", source: "local" }),
  cache,
  limits: { depth: 8, maxBytes: 1024 },
  page: "p1",
  depth: 0,
  path: [],
  query: new URLSearchParams(),
  headers,
  newId: () => "id",
  now: () => 0,
});

describe("one placement's view of the server's cache", () => {
  it("reads and writes for a placement that declared a lifetime", () => {
    const cache = memory();
    placementCache(input(cache, { cache: { ttl: 1000 } })).write("<p>cart</p>", undefined);
    expect(placementCache(input(cache, { cache: { ttl: 1000 } })).read()).toBe("<p>cart</p>");
  });

  it("neither reads nor writes for one that declared none, whatever another page cached", () => {
    const cache = memory();
    placementCache(input(cache, {})).write("<p>mine</p>", undefined);
    expect(cache.store.size).toBe(0);
    placementCache(input(cache, { cache: { ttl: 1000 } })).write("<p>theirs</p>", undefined);
    expect(placementCache(input(cache, {})).read()).toBeUndefined();
  });

  it("neither reads nor writes for a request carrying a credential", () => {
    const cache = memory();
    const plan = { cache: { ttl: 1000 } };
    placementCache(input(cache, plan, { authorization: "Bearer x" })).write("<p>x</p>", undefined);
    expect(cache.store.size).toBe(0);
    placementCache(input(cache, plan)).write("<p>shared</p>", undefined);
    expect(placementCache(input(cache, plan, { cookie: "s=1" })).read()).toBeUndefined();
  });

  it("keeps what each lifetime cached apart, so a shorter one never reads a longer one's", () => {
    const cache = memory();
    placementCache(input(cache, { cache: { ttl: 60_000 } })).write("<p>long</p>", undefined);
    expect(placementCache(input(cache, { cache: { ttl: 1000 } })).read()).toBeUndefined();
    expect(placementCache(input(cache, { cache: { ttl: 60_000 } })).read()).toBe("<p>long</p>");
  });
});
