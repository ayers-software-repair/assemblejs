// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineAssembly } from "@assemblejs/core";

describe("declaring an assembly", () => {
  it("returns what it was given, and names it at the point of declaration", () => {
    const definition = defineAssembly({
      name: "cart",
      views: { default: { renderer: "html", data: () => ({}), markup: () => "<p>cart</p>" } },
    });
    expect(definition.name).toBe("cart");
  });
});
