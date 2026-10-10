// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyProps } from "@assemblejs/renderer-svelte";

describe("what a Svelte assembly receives", () => {
  it("is the same name every renderer's assembly receives, and nothing of its children", () => {
    const props: AssemblyProps<{ total: number }> = { data: { total: 2 } };
    // An author moving between a Svelte assembly and a React one on the same page should not
    // have to learn a second shape for the same thing.
    expect(Object.keys(props)).toEqual(["data"]);
  });
});
