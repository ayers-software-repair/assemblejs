// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyProps } from "@assemblejs/renderer-preact";

describe("what a Preact assembly receives", () => {
  it("gets its children already rendered, as strings", () => {
    const props: AssemblyProps<{ total: number }> = {
      data: { total: 2 },
      children: { inner: "<p>from another renderer</p>" },
    };
    // One conversion, in the caller: plain HTML nests inside Preact the way Preact nests inside
    // Markdown, because neither renderer fetches its own children.
    expect(typeof props.children["inner"]).toBe("string");
  });
});
