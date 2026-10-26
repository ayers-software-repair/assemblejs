// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { originOf } from "@asmjs/check";

describe("the origin of a url", () => {
  it("is the scheme, host and port of one, and nothing for what is not a url", () => {
    expect(originOf("https://shop.example.com:8443/assembly/cart/")).toBe(
      "https://shop.example.com:8443",
    );
    expect(originOf("not a url")).toBeUndefined();
    expect(originOf(undefined)).toBeUndefined();
  });
});
