// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { refuseBeforeDispatch } from "@assemblejs/core";

const at = (depth: number, path: readonly string[] = [], signal?: AbortSignal, ordinal = 1) => ({
  name: "cart",
  view: "default",
  depth,
  path,
  limits: { depth: 3, maxBytes: 1024, placements: 2 },
  signal,
  ordinal,
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

  it("refuses a placement numbered past how many one request may place, and none before", () => {
    expect(refuseBeforeDispatch(at(0, [], undefined, 2))).toBeUndefined();
    expect(refuseBeforeDispatch(at(0, [], undefined, 3))).toBe("too-many");
    // What it is comes before how many came before it, and an abort comes last.
    expect(refuseBeforeDispatch(at(3, [], undefined, 3))).toBe("depth");
    expect(refuseBeforeDispatch(at(1, ["cart/default"], undefined, 3))).toBe("cycle");
    const request = new AbortController();
    request.abort();
    expect(refuseBeforeDispatch(at(0, [], request.signal, 3))).toBe("too-many");
  });

  it("refuses once the request the composition belongs to has been aborted", () => {
    const request = new AbortController();
    expect(refuseBeforeDispatch(at(0, [], request.signal))).toBeUndefined();
    request.abort();
    expect(refuseBeforeDispatch(at(0, [], request.signal))).toBe("timeout");
    // What the design refuses is said first, so the reason never depends on timing.
    expect(refuseBeforeDispatch(at(3, [], request.signal))).toBe("depth");
    expect(refuseBeforeDispatch(at(1, ["cart/default"], request.signal))).toBe("cycle");
  });
});
