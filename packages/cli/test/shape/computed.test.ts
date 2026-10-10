// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { SEGMENT } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { COMPUTED } from "@assemblejs/cli";

describe("the mark on a value a source computes", () => {
  it("is one word, said the same wherever a shape is shown", () => {
    expect(COMPUTED).toBe("(computed)");
  });

  it("is nothing an author could have written where it stands", () => {
    expect(COMPUTED.startsWith("/")).toBe(false);
    expect(SEGMENT.test(COMPUTED)).toBe(false);
    expect(URL.canParse(COMPUTED)).toBe(false);
  });
});
