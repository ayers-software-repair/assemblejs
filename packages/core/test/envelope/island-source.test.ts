// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { IslandSource } from "@assemblejs/core";

describe("what a projection is built from", () => {
  it("needs everything but the deferred flag, which defaults", () => {
    const source: IslandSource = {
      id: "a7f3",
      name: "cart",
      view: "default",
      renderer: "svelte",
      data: {},
    };
    expect(source.deferred).toBeUndefined();
  });
});
