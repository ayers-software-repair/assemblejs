// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { declaredView } from "@assemblejs/core";
import type { AssemblyDefinition, AssemblyView } from "@assemblejs/core";

const view: AssemblyView = { renderer: "html", markup: () => "" };
const cart: AssemblyDefinition = { name: "cart", views: { default: view } };

describe("the view an assembly declared under a name", () => {
  it("is the one it wrote", () => {
    expect(declaredView(cart, "default")).toBe(view);
  });

  it("is nothing for a name it did not write", () => {
    expect(declaredView(cart, "wide")).toBeUndefined();
  });

  // Every object answers to these, so a lookup through the object finds something for each.
  it("is nothing for a name every object answers to", () => {
    for (const name of ["constructor", "toString", "valueOf", "hasOwnProperty", "__proto__"]) {
      expect(declaredView(cart, name), name).toBeUndefined();
    }
  });

  it("is the view an assembly wrote under such a name, where it did", () => {
    expect(declaredView({ name: "cart", views: { constructor: view } }, "constructor")).toBe(view);
  });
});
