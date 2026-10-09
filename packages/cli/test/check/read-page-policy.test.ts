// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readPagePolicy } from "@assemblejs/cli";

describe("reading a page's policy from its declaration", () => {
  it("names each placement from another server, with the url when it is a literal", () => {
    const source = `const link = { cart: { url: "https://elsewhere.example/" } };
    export default definePage({
      place: {
        cart: { retry: { attempts: 2 }, url: "https://shop.example.com/assembly/cart/", deadline: 800 },
        "mini-cart": { deadline: 100, url: 'https://shop.example.com/assembly/mini/' },
        search: { url: base + "/assembly/search/" },
        // done: { url: "https://commented.example/assembly/done/" },
        local: { deadline: 300 },
      },
    });`;
    expect([...readPagePolicy(source).remote]).toEqual([
      ["cart", "https://shop.example.com/assembly/cart/"],
      ["mini-cart", "https://shop.example.com/assembly/mini/"],
      ["search", undefined],
    ]);
  });

  it("reads each policy as written, a computed value left out, a computed url kept as a mark", () => {
    // Inside a nested object a computed value stays as it is: the rules read only that the cache
    // is there. What is written is kept whole: a null, a negated number, an array of policies.
    const source = `export default definePage({
      place: {
        cart: { deadline: 800, defer: true, cache: { ttl: ms }, required: flag },
        search: { url: base + "/assembly/search/", defer: true },
        soon: policy(),
        odd: "not an object",
        none: null,
        late: { deadline: -1 },
      },
    });`;
    expect(readPagePolicy(source).place).toStrictEqual({
      cart: { deadline: 800, defer: true, cache: { ttl: undefined } },
      search: { url: "(computed)", defer: true },
      odd: "not an object",
      none: null,
      late: { deadline: -1 },
    });
    expect(readPagePolicy("export default { place: [{ defer: true }] };").place).toStrictEqual({
      "0": { defer: true },
    });
  });

  it("reads the stream when it is written, and no policy from a declaration that is not an object", () => {
    expect(readPagePolicy('export default definePage({ stream: "/api/ticks" });').stream).toBe(
      "/api/ticks",
    );
    expect(readPagePolicy("export default definePage({ stream: process.env.S });").stream).toBe(
      undefined,
    );
    expect(readPagePolicy("export default page();")).toEqual({
      place: {},
      remote: new Map(),
      stream: undefined,
    });
  });

  it("throws for a declaration that cannot be compiled, for the caller to report", () => {
    expect(() => readPagePolicy("export default {")).toThrow();
  });
});
