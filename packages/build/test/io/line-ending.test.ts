// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { lineEnding } from "@assemblejs/build";

const CR = String.fromCharCode(13);

describe("how a file ends its lines", () => {
  it("is a line feed, or a carriage return and one, by the first line it ends", () => {
    expect(lineEnding("one\ntwo\n")).toBe("\n");
    expect(lineEnding(`one${CR}\ntwo${CR}\n`)).toBe(`${CR}\n`);
    // A file that ends them both ways is read by its first.
    expect(lineEnding(`one${CR}\ntwo\n`)).toBe(`${CR}\n`);
    expect(lineEnding(`one\ntwo${CR}\n`)).toBe("\n");
  });

  it("is a line feed for a file that ends none, or that opens with one", () => {
    expect(lineEnding("")).toBe("\n");
    expect(lineEnding("one line")).toBe("\n");
    expect(lineEnding("\nsecond")).toBe("\n");
  });
});
