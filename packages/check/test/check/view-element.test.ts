// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ViewElement } from "@asmjs/check";

describe("one element a view writes", () => {
  it("is its tag, its attributes as written, where it starts, and whether the template computes it", () => {
    const attributes = new Map<string, string | true>([
      ["alt", ""],
      ["hidden", true],
    ]);
    const img: ViewElement = { tag: "img", attributes, at: 12, computed: false };
    expect(img.attributes.get("alt")).toBe("");
    expect(img.attributes.get("hidden")).toBe(true);
    expect(img.attributes.has("src")).toBe(false);
  });
});
