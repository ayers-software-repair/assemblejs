// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { fallBack } from "@assemblejs/core";
import type { AssemblyPlan, ContentCache, Diagnostic, SettleInput } from "@assemblejs/core";

const failure: Diagnostic = {
  name: "cart",
  view: "default",
  id: "id-1",
  source: "fallback",
  reason: "status",
  correlationId: "c-1",
  ms: 3,
};

/** A cache that already holds this placement's last good content. */
const holding = (html: string): ContentCache => ({ get: () => ({ html }), set: () => undefined });

const input = (plan: Partial<AssemblyPlan>, cache?: ContentCache): SettleInput => ({
  name: "cart",
  view: "default",
  plan: { name: "cart", view: "default", deadline: 3000, ...plan },
  fetch: async () => ({ ok: true, html: "", source: "local" }),
  cache,
  limits: { depth: 8, maxBytes: 1024, placements: 64 },
  page: "p1",
  depth: 0,
  path: [],
  ordinal: 1,
  count: () => 1,
  query: new URLSearchParams(),
  params: {},
  headers: {},
  signal: undefined,
  newId: () => "id-2",
  now: () => 0,
});

describe("the rungs after a failure", () => {
  it("shows the declared fallback before any last good content, marked failed", () => {
    const settled = fallBack(
      input({ fallback: "<p>stand-in</p>", cache: { ttl: 60_000 } }, holding("<p>yesterday</p>")),
      "id-1",
      failure,
      true,
    );
    expect(settled.html).toContain("<p>stand-in</p>");
    expect(settled.html).toContain('data-failed="c-1"');
    expect(settled.diagnostic.source).toBe("fallback");
  });

  it("answers with the last good content when it declared a lifetime and no fallback", () => {
    const settled = fallBack(
      input({ cache: { ttl: 60_000 } }, holding("<p>yesterday</p>")),
      "id-1",
      failure,
      true,
    );
    expect(settled.html).toBe("<p>yesterday</p>");
    expect(settled.diagnostic).toEqual({ ...failure, source: "cache" });
  });

  it("never reads what another page cached when it declared no lifetime of its own", () => {
    const settled = fallBack(input({}, holding("<p>another page's</p>")), "id-1", failure, true);
    expect(settled.html).not.toContain("another page's");
    expect(settled.html).toMatch(/^<assembly-root data-name="cart" [^>]*data-failed="c-1">/);
  });

  it("does not read the cache when it is told the cache may not answer", () => {
    const settled = fallBack(
      input({ cache: { ttl: 60_000 } }, holding("<p>cached</p>")),
      "id-1",
      failure,
      false,
    );
    expect(settled.html).not.toContain("cached");
  });

  it("renders an empty envelope marked failed when there is nothing else", () => {
    const settled = fallBack(input({}), "id-1", failure, true);
    expect(settled.html).toMatch(/^<assembly-root data-name="cart" [^>]*data-failed="c-1">/);
  });
});

describe("a required placement", () => {
  it("does not die when the cache still holds its last good content", () => {
    const settled = fallBack(
      input({ required: true, cache: { ttl: 60_000 } }, holding("<p>yesterday</p>")),
      "id-1",
      failure,
      true,
    );
    // The ladder answered it, so it did not fail, so the page lives.
    expect(settled.html).toBe("<p>yesterday</p>");
  });

  it("dies when nothing holds it, whatever fallback it declared", () => {
    expect(() =>
      fallBack(input({ required: true, fallback: "<p>x</p>" }), "id-1", failure, true),
    ).toThrow(/required assembly "cart"/);
  });
});
