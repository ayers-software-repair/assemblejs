// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isView } from "@assemblejs/cli";

describe("whether a file in an assembly's directory is a view of it", () => {
  it("is, where its name says its renderer", () => {
    for (const file of ["cart.html", "cart.react.tsx", "cart.svelte", "cart.lit.ts", "row.ejs"]) {
      expect(isView("cart", file), file).toBe(true);
    }
  });

  it("is not, for its browser half, a module of the author's, or a file with no renderer", () => {
    for (const file of ["cart.client.ts", "cart.service.ts", "Row.tsx", "cart.css", "LICENSE"]) {
      expect(isView("cart", file), file).toBe(false);
    }
  });

  // Each was counted as a view of its own, and the assembly was then one with two views.
  it("is not, for a test, a spec or a story beside the view", () => {
    for (const file of [
      "cart.test.tsx",
      "cart.react.test.tsx",
      "cart.spec.jsx",
      "cart.stories.tsx",
      "cart.story.svelte",
    ]) {
      expect(isView("cart", file), file).toBe(false);
    }
  });

  it("is not, for prose: a Markdown file under any name but the assembly's", () => {
    expect(isView("cart", "README.md")).toBe(false);
    expect(isView("cart", "notes.md")).toBe(false);
    expect(isView("about", "about.md")).toBe(true);
  });
});
