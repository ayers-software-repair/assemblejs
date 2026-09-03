// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DiscoveredAssembly } from "@assemblejs/cli";

describe("an assembly found on disk", () => {
  it("names its view and the renderer that view chose", () => {
    const found: DiscoveredAssembly = {
      name: "cart",
      directory: "src/assemblies/cart",
      view: "src/assemblies/cart/cart.svelte",
      renderer: "svelte",
      client: undefined,
      styles: [],
    };
    expect(found.renderer).toBe("svelte");
  });
});
