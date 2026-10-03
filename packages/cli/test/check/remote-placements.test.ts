// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { remotePlacements } from "@assemblejs/cli";

describe("the placements a page declares from another server", () => {
  it("names each placement whose policy has a url, with the url when it is a literal", () => {
    const source = `export default definePage({
      place: {
        cart: { retry: { attempts: 2 }, url: "https://shop.example.com/assembly/cart/", deadline: 800 },
        "mini-cart": { deadline: 100, url: 'https://shop.example.com/assembly/mini/' },
        search: { url: base + "/assembly/search/" },
        // done: { url: "https://commented.example/assembly/done/" },
        local: { deadline: 300 },
      },
    });`;
    expect([...remotePlacements(source)]).toEqual([
      ["cart", "https://shop.example.com/assembly/cart/"],
      ["mini-cart", "https://shop.example.com/assembly/mini/"],
      ["search", undefined],
    ]);
  });
});
