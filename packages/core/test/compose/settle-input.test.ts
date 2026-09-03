// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { SettleInput } from "@assemblejs/core";

describe("what settling a placement needs", () => {
  it("includes the clock and the id source, so the function owns neither", () => {
    const input: SettleInput = {
      name: "cart",
      view: "default",
      plan: undefined,
      fetch: async () => ({ ok: true, html: "", source: "local" }),
      cache: undefined,
      limits: { depth: 8, maxBytes: 1024 },
      page: "p1",
      depth: 0,
      path: [],
      query: new URLSearchParams(),
      headers: {},
      newId: () => "fixed",
      now: () => 0,
    };
    // Both are injected, which is what makes a diagnostic assertable and a run replayable.
    expect(input.newId()).toBe("fixed");
    expect(input.now()).toBe(0);
  });
});
