// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { OutlineToolbar } from "@assemblejs/core/outline";
import { createToolbar } from "@assemblejs/core/outline";

describe("the outline's one control on a page", () => {
  it("is an element, and a way to show what it says", () => {
    const toolbar: OutlineToolbar = createToolbar(document, () => undefined);
    toolbar.show(true, "/: 3 assemblies");
    expect(toolbar.element.textContent).toContain("/: 3 assemblies");
  });
});
