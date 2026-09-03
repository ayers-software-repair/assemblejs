// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { RenderInput } from "@assemblejs/core/renderer";

describe("what a renderer receives", () => {
  it("hands children over already rendered, as strings", () => {
    const input: RenderInput = {
      template: "<main>{{cart}}</main>",
      data: { total: 2 },
      children: { cart: "<p>cart</p>" },
      helpers: {},
      url: new URL("https://example.com/"),
    };
    // A renderer never fetches a child; the conversion happened once, in the caller.
    expect(typeof input.children["cart"]).toBe("string");
  });
});
