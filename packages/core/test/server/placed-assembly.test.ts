// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PlacedAssembly } from "@assemblejs/core";

describe("what the placement rules know about an assembly", () => {
  it("is its views and whether it puts the runtime on the page, and nothing of how it renders", () => {
    const hello: PlacedAssembly = { views: ["default"], browserHalf: false };
    expect(Object.keys(hello).sort()).toEqual(["browserHalf", "views"]);
  });
});
