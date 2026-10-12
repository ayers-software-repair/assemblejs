// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED, readPagePolicy } from "@assemblejs/cli";
import { describe, expect, it } from "vitest";
import { pagePlacements } from "@assemblejs/mcp";

const placements = (source: string) => pagePlacements(readPagePolicy(source));

describe("a page's placements as the server would take them", () => {
  it("keeps each field written as the server's type, and leaves out what is computed or wrong", () => {
    expect(
      placements(
        'export default { place: { cart: { deadline: 800, fallback: "<p>soon</p>", required: false, defer: true, cache: { ttl: 60 } }, ad: { deadline: ms, fallback: 5 }, raw: 3 } };',
      ),
    ).toEqual({
      cart: {
        deadline: 800,
        fallback: "<p>soon</p>",
        required: false,
        defer: true,
        cache: { ttl: 60 },
      },
      ad: {},
    });
  });

  it("composes a placement from another server deferred, with no url, whether written or computed", () => {
    const read = placements(
      'export default { place: { cart: { url: "https://shop.example.com/assembly/cart/", deadline: 500 }, ad: { url: process.env.AD } } };',
    );
    expect(read).toEqual({ cart: { deadline: 500, defer: true }, ad: { defer: true } });
    expect(readPagePolicy("export default { place: { ad: { url: x } } };").place["ad"]).toEqual({
      url: COMPUTED,
    });
  });

  it("is empty for a declaration that places nothing", () => {
    expect(placements("export default { route: '/x' };")).toEqual({});
  });
});
