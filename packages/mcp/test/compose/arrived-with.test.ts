// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ArrivedWith } from "@asmjs/mcp";

describe("what a visitor arrives at a page with", () => {
  it("is a value for each parameter of the route, and a query, each of them optional", () => {
    const full: ArrivedWith = { params: { sku: "kb-250" }, query: { grind: "espresso" } };
    const none: ArrivedWith = {};
    expect(new URLSearchParams(full.query).toString()).toBe("grind=espresso");
    expect(new URLSearchParams(none.query).toString()).toBe("");
    expect(full.params?.["sku"]).toBe("kb-250");
  });
});
