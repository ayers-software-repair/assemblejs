// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { refuseBeforeDispatch } from "@assemblejs/core";

const at = (depth: number, path: readonly string[] = []) => ({
  name: "cart",
  view: "default",
  depth,
  path,
  limits: { depth: 3, maxBytes: 1024 },
});

describe("what a parent refuses before it dispatches", () => {
  it("dispatches a placement inside the cap whose target is not among its ancestors", () => {
    expect(refuseBeforeDispatch(at(0))).toBeUndefined();
    expect(refuseBeforeDispatch(at(2, ["page/default", "shell/default"]))).toBeUndefined();
  });

  it("refuses the level that would pass the depth cap, and no earlier", () => {
    // The request would be dispatched one deeper than its parent: at the cap that is one past it.
    expect(refuseBeforeDispatch(at(2))).toBeUndefined();
    expect(refuseBeforeDispatch(at(3))).toBe("depth");
  });

  it("refuses a target already among its ancestors, by name and view together", () => {
    expect(refuseBeforeDispatch(at(1, ["cart/default"]))).toBe("cycle");
    expect(refuseBeforeDispatch(at(1, ["shell/default", "cart/default"]))).toBe("cycle");
    // Another view of the same assembly is another identity, so it is not a cycle.
    expect(refuseBeforeDispatch(at(1, ["cart/compact"]))).toBeUndefined();
  });
});
