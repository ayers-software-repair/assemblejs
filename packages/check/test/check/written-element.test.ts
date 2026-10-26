// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { WrittenElement } from "@asmjs/check";

describe("one element with the file it is written in", () => {
  it("pairs the element with its file", () => {
    const one: WrittenElement = {
      file: "src/assemblies/card/card.html",
      element: { tag: "p", attributes: new Map(), at: 0, computed: false },
    };
    expect(one.file).toContain("card.html");
    expect(one.element.tag).toBe("p");
  });
});
