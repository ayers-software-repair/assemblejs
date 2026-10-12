// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { OutlineBox } from "@assemblejs/core/outline";
import { createBox } from "@assemblejs/core/outline";

describe("what an outline draws for one envelope", () => {
  it("is a frame and a note, two elements that stand beside each other", () => {
    const box: OutlineBox = createBox(document);
    expect(box.frame).not.toBe(box.note);
    expect(box.frame.contains(box.note)).toBe(false);
  });
});
