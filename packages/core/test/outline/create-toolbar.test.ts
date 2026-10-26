// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createToolbar } from "@asmjs/core/outline";

describe("what is made as the outline's control", () => {
  it("is a switch that says whether it is on, and calls back when it is pressed", () => {
    let pressed = 0;
    const toolbar = createToolbar(document, () => (pressed += 1));
    const button = toolbar.element.querySelector("button") as HTMLButtonElement;
    toolbar.show(false, "");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    button.click();
    expect(pressed).toBe(1);
    toolbar.show(true, "/: 2 assemblies");
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("says what each colour means in words, and only while the outline is on", () => {
    const toolbar = createToolbar(document, () => undefined);
    const key = toolbar.element.querySelector("ul") as HTMLElement;
    toolbar.show(false, "");
    expect(key.hidden).toBe(true);
    toolbar.show(true, "/: 2 assemblies, composed in 4 ms");
    expect(key.hidden).toBe(false);
    expect([...key.children].map((entry) => (entry as HTMLElement).dataset.tone)).toEqual([
      "local",
      "remote",
      "cache",
      "fallback",
      "deferred",
      "inner",
    ]);
    expect(key.textContent).toContain("another server");
    expect(toolbar.element.querySelector(".sum")?.textContent).toBe(
      "/: 2 assemblies, composed in 4 ms",
    );
  });
});
