// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { serverEvents } from "@assemblejs/core/client";
import { describe, expect, it } from "vitest";
import type { AssemblyProps } from "@assemblejs/renderer-lit";

describe("what a Lit view receives", () => {
  it("gets its children already rendered, as strings", () => {
    const props: AssemblyProps<{ total: number }> = {
      data: { total: 2 },
      children: { inner: "<p>from another renderer</p>" },
      events: serverEvents(),
    };
    // One conversion, in the caller: plain HTML nests inside Lit the way Lit nests inside
    // Markdown, because neither renderer fetches its own children.
    expect(typeof props.children["inner"]).toBe("string");
  });
});
