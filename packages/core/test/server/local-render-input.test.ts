// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { LocalRenderInput } from "@assemblejs/core";

describe("what one local render is given", () => {
  it("says where in the composition the assembly stands, and how its children are reached", () => {
    const input: LocalRenderInput = {
      id: "a7f3",
      page: "p1",
      depth: 2,
      path: ["shell/default"],
      query: new URLSearchParams("sort=price"),
      params: { sku: "a1" },
      fetch: async () => ({ ok: true, html: "", source: "local" }),
      limits: { depth: 8, maxBytes: 1024 },
      newId: () => "fixed",
      now: () => 0,
    };
    // Depth and path are required by the type: there is no default a render could fall back to.
    expect([input.depth, input.path]).toEqual([2, ["shell/default"]]);
    // The request's own signal is the one thing it may lack: a bare render belongs to none.
    expect(input.signal).toBeUndefined();
    expect(input.newId()).toBe("fixed");
  });
});
