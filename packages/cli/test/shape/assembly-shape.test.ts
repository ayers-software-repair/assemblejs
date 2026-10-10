// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyShape } from "@assemblejs/cli";

describe("one assembly as its sources say it", () => {
  it("is its files, what its view places, and where it is placed", () => {
    const assembly: AssemblyShape = {
      name: "cart",
      directory: "src/assemblies/cart",
      view: "src/assemblies/cart/cart.html",
      renderer: "html",
      styles: [],
      browserHalf: false,
      places: [{ name: "price", view: "default" }],
      placedOn: ["home"],
      placedIn: ["shell"],
    };
    expect(assembly.client).toBeUndefined();
    expect(assembly.service).toBeUndefined();
    expect(assembly.placedOn).toEqual(["home"]);
  });
});
