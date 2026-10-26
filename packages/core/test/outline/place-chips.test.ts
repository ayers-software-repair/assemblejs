// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { placeChips } from "@asmjs/core/outline";

const chip = (left: number, top: number, width = 60) => ({ left, top, width, height: 18 });

describe("placing chips so that none covers another", () => {
  it("leaves each where it was wanted while they stand apart", () => {
    const wanted = [chip(0, 0), chip(100, 0), chip(0, 40)];
    expect(placeChips(wanted)).toEqual(wanted);
  });

  it("steps what an assembly holds below its parent's chip, in document order", () => {
    expect(placeChips([chip(0, 0), chip(0, 0), chip(10, 4)]).map((at) => at?.top)).toEqual([
      0, 18, 36,
    ]);
  });

  it("gives no place to an entry that wants none, and keeps the order", () => {
    expect(placeChips([undefined, chip(0, 0), undefined, chip(0, 0)])).toEqual([
      undefined,
      chip(0, 0),
      undefined,
      chip(0, 18),
    ]);
  });
});
