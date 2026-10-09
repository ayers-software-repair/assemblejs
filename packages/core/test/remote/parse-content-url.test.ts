// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { parseContentUrl } from "@assemblejs/core";

describe("reading a placement url as a content endpoint", () => {
  it("takes the contract's path apart, the default view when none is named", () => {
    expect(parseContentUrl("https://checkout.example.com/assembly/cart/")).toEqual({
      origin: "https://checkout.example.com",
      name: "cart",
      view: "default",
      content: "https://checkout.example.com/assembly/cart/",
      manifest: "https://checkout.example.com/assembly/cart/default/manifest/",
    });
    expect(parseContentUrl("http://127.0.0.1:4000/assembly/cart/compact/")?.view).toBe("compact");
  });

  it("is undefined for anything the contract does not describe", () => {
    for (const url of [
      "not a url",
      "ftp://x.example.com/assembly/cart/",
      "https://user:pw@x.example.com/assembly/cart/",
      "https://x.example.com/assembly/cart/?a=1",
      "https://x.example.com/assembly/cart/#x",
      "https://x.example.com/assembly/cart",
      "https://x.example.com/assembly/Cart/",
      "https://x.example.com/other/cart/",
      "https://x.example.com/assembly/cart/default/manifest/",
    ]) {
      expect(parseContentUrl(url)).toBeUndefined();
    }
  });
});
