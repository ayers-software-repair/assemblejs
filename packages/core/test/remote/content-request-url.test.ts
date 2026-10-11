// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { contentRequestUrl } from "@assemblejs/core";

const content = "https://shop.example/assembly/cart/";

describe("the url a remote's content endpoint is asked at", () => {
  it("carries the page's query only to a remote declared trusted", () => {
    const query = new URLSearchParams("note=hello&page=2");
    expect(contentRequestUrl(content, true, query)).toBe(`${content}?note=hello&page=2`);
    expect(contentRequestUrl(content, false, query)).toBe(content);
  });

  it("is the bare content url when the page was asked with no query, trusted or not", () => {
    expect(contentRequestUrl(content, true, new URLSearchParams())).toBe(content);
    expect(contentRequestUrl(content, false, new URLSearchParams())).toBe(content);
  });
});
