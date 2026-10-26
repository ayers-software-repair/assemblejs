// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { NAMED_COLOURS } from "@asmjs/build";

describe("the named colours of CSS", () => {
  it("holds the 148 names of CSS Color Level 4, lower-cased, and neither transparent nor currentcolor", () => {
    expect(NAMED_COLOURS.size).toBe(148);
    expect(NAMED_COLOURS.has("rebeccapurple")).toBe(true);
    expect([...NAMED_COLOURS].every((name) => /^[a-z]+$/.test(name))).toBe(true);
    expect(NAMED_COLOURS.has("transparent")).toBe(false);
    expect(NAMED_COLOURS.has("currentcolor")).toBe(false);
  });
});
