// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OpenElements } from "@assemblejs/core";

const opened = (
  ...elements: ReadonlyArray<readonly [string, "html" | "svg" | "math"]>
): OpenElements => {
  const open = new OpenElements();
  for (const [name, kind] of elements) open.open(name, kind);
  return open;
};

describe("the elements open around a place in a remote's answer", () => {
  it("knows how many are open, the innermost, and whether one of a name is open at any depth", () => {
    const open = opened(["assembly-root", "html"], ["svg", "svg"], ["a", "svg"]);
    expect(open.depth).toBe(3);
    expect(open.innermost).toMatchObject({ name: "a", kind: "svg" });
    expect([open.holds("a"), open.holds("svg"), open.holds("p")]).toEqual([true, true, false]);
    open.close();
    expect([open.depth, open.innermost?.name, open.holds("a")]).toEqual([2, "svg", false]);
  });

  it("counts an element open twice until both have closed", () => {
    const open = opened(["a", "html"], ["span", "html"], ["a", "html"]);
    open.close();
    expect(open.holds("a")).toBe(true);
    open.close();
    open.close();
    expect([open.holds("a"), open.depth, open.innermost]).toEqual([false, 0, undefined]);
    // Closing with nothing open closes nothing.
    open.close();
    expect(open.depth).toBe(0);
  });

  it("finds an open paragraph through elements that do not end the search for one", () => {
    expect(opened(["p", "html"]).paragraph).toBe(true);
    expect(opened(["p", "html"], ["span", "html"], ["em", "html"]).paragraph).toBe(true);
    expect(opened(["div", "html"]).paragraph).toBe(false);
    expect(new OpenElements().paragraph).toBe(false);
  });

  it("stops at an element of the browser's button scope, each in the kind it is named for", () => {
    for (const [name, kind] of [
      ["button", "html"],
      ["td", "html"],
      ["template", "html"],
      ["foreignobject", "svg"],
      ["title", "svg"],
      ["mtext", "math"],
      ["annotation-xml", "math"],
    ] as const) {
      expect(opened(["p", "html"], [name, kind]).paragraph, name).toBe(false);
    }
    // The same names in another kind are elements like any other, and the search goes on.
    for (const [name, kind] of [
      ["title", "math"],
      ["mtext", "svg"],
      ["annotation-xml", "html"],
      ["foreignobject", "html"],
    ] as const) {
      expect(opened(["p", "html"], [name, kind]).paragraph, name).toBe(true);
    }
  });

  it("finds the paragraph again when what ended the search has closed, and one opened beyond it", () => {
    const open = opened(["p", "html"], ["button", "html"]);
    open.open("p", "html");
    expect(open.paragraph).toBe(true);
    open.close();
    expect(open.paragraph).toBe(false);
    open.close();
    expect(open.paragraph).toBe(true);
  });
});
