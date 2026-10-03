// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { startTagRefusal } from "@assemblejs/core";

const root = "assembly-root";

describe("start tags the browser would answer by closing an element itself", () => {
  it("passes an ordinary tag, and a list item, cell or term inside its own container", () => {
    expect(startTagRefusal("div", [root])).toBeUndefined();
    expect(startTagRefusal("li", [root, "ul"])).toBeUndefined();
    expect(startTagRefusal("td", [root, "table", "tbody", "tr"])).toBeUndefined();
    expect(startTagRefusal("dt", [root, "dl"])).toBeUndefined();
    expect(startTagRefusal("rt", [root, "ruby"])).toBeUndefined();
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
      expect(startTagRefusal(name, open), name).toMatch(/outside its own container/);
    }
  });

  it("refuses a block inside an open paragraph, until a scope boundary", () => {
    expect(startTagRefusal("div", [root, "p", "span"])).toMatch(/open <p>/);
    expect(startTagRefusal("p", [root, "p"])).toMatch(/open <p>/);
    expect(startTagRefusal("div", [root, "p", "button"])).toBeUndefined();
  });

  it("refuses the elements that close one of their own kind", () => {
    expect(startTagRefusal("a", [root, "a", "span"])).toMatch(/inside a <a>/);
    expect(startTagRefusal("button", [root, "button"])).toMatch(/inside a <button>/);
    expect(startTagRefusal("h2", [root, "h1"])).toMatch(/inside a <h1>/);
    expect(startTagRefusal("option", [root, "select", "option"])).toMatch(/<option> inside/);
    expect(startTagRefusal("optgroup", [root, "select", "optgroup"])).toMatch(/<optgroup>/);
    expect(startTagRefusal("table", [root, "table"])).toMatch(/directly in/);
    expect(startTagRefusal("input", [root, "select"])).toMatch(/inside a <select>/);
    expect(startTagRefusal("option", [root, "select"])).toBeUndefined();
  });
});
