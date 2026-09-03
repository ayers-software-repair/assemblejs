// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { IslandPayload } from "@assemblejs/core";

describe("the island payload", () => {
  it("is six fields, and the set is closed", () => {
    const payload: IslandPayload = {
      id: "a7f3",
      name: "cart",
      view: "default",
      renderer: "svelte",
      data: { total: 2 },
      deferred: false,
    };
    expect(Object.keys(payload).sort()).toEqual([
      "data",
      "deferred",
      "id",
      "name",
      "renderer",
      "view",
    ]);
  });
});
