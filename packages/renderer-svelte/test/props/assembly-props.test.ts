// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyProps } from "@assemblejs/renderer-svelte";

describe("what a Svelte assembly receives", () => {
  it("is the same two names every renderer's assembly receives", () => {
    const props: AssemblyProps<{ total: number }> = {
      data: { total: 2 },
      children: { inner: "<p>from another renderer</p>" },
    };
    // An author moving between a Svelte assembly and a React one on the same page should not
    // have to learn a second shape for the same two things.
    expect(Object.keys(props).sort()).toEqual(["children", "data"]);
  });
});
