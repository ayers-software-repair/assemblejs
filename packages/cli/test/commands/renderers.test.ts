// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RENDERERS } from "@assemblejs/cli";

describe("the renderers a view can be scaffolded for", () => {
  it("covers a plain template and every framework the mission names", () => {
    expect(RENDERERS).toContain("html");
    for (const framework of ["react", "preact", "solid", "svelte", "vue"]) {
      expect(RENDERERS).toContain(framework);
    }
  });
});
