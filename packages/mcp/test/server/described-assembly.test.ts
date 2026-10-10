// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DescribedAssembly } from "@assemblejs/mcp";

describe("one assembly as an agent reads it", () => {
  it("is what it is made of, and each place it stands with what that place says of it", () => {
    const cart: DescribedAssembly = {
      name: "cart",
      directory: "src/assemblies/cart",
      view: "src/assemblies/cart/cart.html",
      renderer: "html",
      styles: [],
      browserHalf: false,
      places: [],
      placedOn: [{ page: "home", route: "/", view: "default", policy: { defer: true } }],
      placedIn: [{ assembly: "shell", view: "default" }],
    };
    expect(cart.placedOn[0]?.policy).toEqual({ defer: true });
    expect(cart.placedIn[0]?.assembly).toBe("shell");
  });
});
