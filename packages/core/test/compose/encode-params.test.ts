// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { encodeParams } from "@assemblejs/core";

describe("a page's parameters as one string", () => {
  it("is form encoded in name order, the same whatever order they were read in", () => {
    expect(encodeParams({ slug: "a b&c", id: "42" })).toBe("id=42&slug=a+b%26c");
    expect(encodeParams({ id: "42", slug: "a b&c" })).toBe("id=42&slug=a+b%26c");
    expect(encodeParams({})).toBe("");
  });
});
