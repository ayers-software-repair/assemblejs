// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { OutlineRect } from "@asmjs/core/outline";

describe("a box on the screen", () => {
  it("is measured from the top left of the viewport", () => {
    const rect: OutlineRect = { left: 8, top: 16, width: 320, height: 48 };
    expect(rect.left + rect.width).toBe(328);
  });
});
