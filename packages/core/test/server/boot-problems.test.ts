// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { bootProblems } from "@assemblejs/core";
import type { AssemblyView } from "@assemblejs/core";

const view: AssemblyView = { renderer: "html", data: () => ({}), markup: () => "" };

describe("what is checked before anything listens", () => {
  it("passes a well formed set", () => {
    expect(bootProblems([{ name: "cart", views: { default: view } }])).toEqual([]);
  });

  it("refuses an assembly with no default view", () => {
    const problems = bootProblems([{ name: "cart", views: { compact: view } }]);
    expect(problems.join()).toMatch(/no "default" view/);
  });

  it("refuses a duplicate name, which would otherwise be a silent shadow", () => {
    const problems = bootProblems([
      { name: "cart", views: { default: view } },
      { name: "cart", views: { default: view } },
    ]);
    expect(problems.join()).toMatch(/declared more than once/);
  });

  it("refuses a name that is not a usable url segment", () => {
    for (const name of ["Cart", "../etc/passwd", "cart name", "1cart", ""]) {
      expect(bootProblems([{ name, views: { default: view } }]).join()).toMatch(/url segment/);
    }
  });

  it("refuses a view name that is not a usable url segment", () => {
    const problems = bootProblems([{ name: "cart", views: { default: view, "../x": view } }]);
    expect(problems.join()).toMatch(/url segment/);
  });

  it("reports every problem, not the first", () => {
    expect(bootProblems([{ name: "Cart", views: { compact: view } }]).length).toBe(2);
  });
});
