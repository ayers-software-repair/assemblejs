// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { VueBlock } from "@asmjs/build";

describe("what a block of a single-file component says of itself", () => {
  it("is its language and its source file, each when written", () => {
    const block: VueBlock = { lang: "ts" };
    expect(block.lang).toBe("ts");
    expect(block.src).toBeUndefined();
  });
});
