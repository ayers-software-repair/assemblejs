// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ContentUrl } from "@assemblejs/core";

describe("a content endpoint, taken apart", () => {
  it("names the origin, the assembly, its view, and both of its endpoints", () => {
    const url: ContentUrl = {
      origin: "https://a.example.com",
      name: "cart",
      view: "default",
      content: "https://a.example.com/assembly/cart/",
      manifest: "https://a.example.com/assembly/cart/default/manifest/",
    };
    expect(Object.keys(url)).toHaveLength(5);
  });
});
