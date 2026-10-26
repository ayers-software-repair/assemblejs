// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { countPlacements } from "@asmjs/core";

describe("what counts the placements of one request", () => {
  it("numbers them from one, in the order they are asked for", () => {
    const count = countPlacements(() => "never");
    expect([count.next(), count.next(), count.next()]).toEqual([1, 2, 3]);
    // Two requests share nothing.
    expect(countPlacements(() => "never").next()).toBe(1);
  });

  it("gives every placement it is told was refused the one id, minted at the first", () => {
    let minted = 0;
    const count = countPlacements(() => `c-${String((minted += 1))}`);
    expect(minted).toBe(0);
    expect(count.refuse("too-many", "cart", "default")).toBe("c-1");
    expect(count.refuse("too-many", "price", "compact")).toBe("c-1");
    expect(count.refuse("too-many", "cart", "default")).toBe("c-1");
    expect(minted).toBe(1);
    // Refused for another reason is another account, under an id of its own.
    expect(count.refuse("aborted", "cart", "default")).toBe("c-2");
    expect(count.refuse("aborted", "price", "compact")).toBe("c-2");
    expect(minted).toBe(2);
  });

  it("accounts for them at once by reason: how many, the first of them, and the id they share", () => {
    const count = countPlacements(() => "c-9");
    expect(count.account()).toEqual([]);
    count.refuse("too-many", "cart", "default");
    count.refuse("too-many", "price", "compact");
    count.refuse("aborted", "price", "compact");
    expect(count.account()).toEqual([
      {
        name: "cart",
        view: "default",
        id: "",
        source: "fallback",
        reason: "too-many",
        correlationId: "c-9",
        ms: 0,
        refused: 2,
      },
      {
        name: "price",
        view: "compact",
        id: "",
        source: "fallback",
        reason: "aborted",
        correlationId: "c-9",
        ms: 0,
        refused: 1,
      },
    ]);
  });
});
