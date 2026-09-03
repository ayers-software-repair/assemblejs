// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { assemblyFiles } from "@assemblejs/cli";

describe("what a new assembly is made of", () => {
  it("names the view file so its framework is visible from a directory listing", () => {
    expect(Object.keys(assemblyFiles("cart", "svelte") ?? {})).toContain(
      "src/assemblies/cart/cart.svelte",
    );
    expect(Object.keys(assemblyFiles("cart", "react") ?? {})).toContain(
      "src/assemblies/cart/cart.react.tsx",
    );
  });

  it("is a view and its styles, and nothing to register anywhere", () => {
    const files = assemblyFiles("cart", "html") ?? {};
    expect(Object.keys(files).sort()).toEqual([
      "src/assemblies/cart/cart.css",
      "src/assemblies/cart/cart.html",
    ]);
  });

  it("is nothing at all for a renderer it does not know", () => {
    expect(assemblyFiles("cart", "angular")).toBeUndefined();
  });
});
