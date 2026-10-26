// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { withinSpans } from "@asmjs/core";

describe("whether an offset falls inside one of a list of stretches", () => {
  const within = withinSpans([
    [2, 5],
    [5, 6],
    [10, 14],
  ]);

  it("is true from a stretch's start up to, and not at, its end", () => {
    expect([2, 3, 4, 5, 10, 13].map(within)).toEqual([true, true, true, true, true, true]);
    expect([0, 1, 6, 9, 14, 99].map(within)).toEqual([false, false, false, false, false, false]);
  });

  it("is false everywhere when there are none", () => {
    expect(withinSpans([])(0)).toBe(false);
  });

  it("answers for every one of a great many stretches", () => {
    const spans = Array.from({ length: 100_000 }, (_, at) => [at * 3, at * 3 + 2] as const);
    const many = withinSpans(spans);
    for (let at = 0; at < spans.length; at += 1) {
      if (!many(at * 3) || !many(at * 3 + 1) || many(at * 3 + 2)) throw new Error(`at ${at}`);
    }
  });
});
