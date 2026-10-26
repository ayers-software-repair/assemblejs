// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OpenElements, startTagRefusal } from "@asmjs/core";

const root = "assembly-root";
/** These elements open, outermost first, each of them HTML. */
const inside = (...names: readonly string[]): OpenElements => {
  const open = new OpenElements();
  for (const name of names) open.open(name, "html");
  return open;
};

describe("start tags the browser would answer by closing an element itself", () => {
  it("passes an ordinary tag, and a list item, cell or term inside its own container", () => {
    expect(startTagRefusal("div", inside(root))).toBeUndefined();
    expect(startTagRefusal("li", inside(root, "ul"))).toBeUndefined();
    expect(startTagRefusal("td", inside(root, "table", "tbody", "tr"))).toBeUndefined();
    expect(startTagRefusal("dt", inside(root, "dl"))).toBeUndefined();
    expect(startTagRefusal("rt", inside(root, "ruby"))).toBeUndefined();
  });

  it("refuses one outside its own container, which would close the page's", () => {
    for (const [name, open] of [
      ["li", [root]],
      ["li", [root, "ul", "li"]],
      ["dd", [root, "dl", "dt"]],
      ["td", [root, "table"]],
      ["tr", [root, "div"]],
      ["col", [root]],
      ["rt", [root, "ruby", "rb"]],
    ] as const) {
      expect(startTagRefusal(name, inside(...open)), name).toMatch(/outside its own container/);
    }
  });

  it("refuses a block inside an open paragraph, until a scope boundary", () => {
    expect(startTagRefusal("div", inside(root, "p", "span"))).toMatch(/open <p>/);
    expect(startTagRefusal("p", inside(root, "p"))).toMatch(/open <p>/);
    expect(startTagRefusal("div", inside(root, "p", "button"))).toBeUndefined();
  });

  it("refuses the elements that close one of their own kind", () => {
    expect(startTagRefusal("a", inside(root, "a", "span"))).toMatch(/inside a <a>/);
    expect(startTagRefusal("button", inside(root, "button"))).toMatch(/inside a <button>/);
    expect(startTagRefusal("form", inside(root, "form", "div"))).toMatch(/inside a <form>/);
    expect(startTagRefusal("h2", inside(root, "h1"))).toMatch(/inside a <h1>/);
    expect(startTagRefusal("option", inside(root, "select", "option"))).toMatch(/<option> inside/);
    expect(startTagRefusal("optgroup", inside(root, "select", "optgroup"))).toMatch(/<optgroup>/);
    expect(startTagRefusal("table", inside(root, "table"))).toMatch(/directly in/);
    expect(startTagRefusal("input", inside(root, "select"))).toMatch(/inside a <select>/);
    expect(startTagRefusal("option", inside(root, "select"))).toBeUndefined();
  });

  // The name asked about is whatever the answer wrote, and every object answers to this one.
  it("passes an element named after what every object has", () => {
    expect(startTagRefusal("constructor", inside(root))).toBeUndefined();
  });
});
