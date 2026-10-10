// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyProps } from "@assemblejs/renderer-preact";

describe("what a Preact assembly receives", () => {
  it("is its data, and nothing of its children", () => {
    const props: AssemblyProps<{ total: number }> = { data: { total: 2 } };
    // A child is placed with Slot, which writes the directive the composer replaces, so no
    // child's markup is ever handed to a view.
    expect(Object.keys(props)).toEqual(["data"]);
  });
});
