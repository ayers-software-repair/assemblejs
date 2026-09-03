// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyRequest } from "@assemblejs/core";

describe("an assembly request", () => {
  it("carries the composition state its parent allocated", () => {
    const request: AssemblyRequest = {
      name: "cart",
      view: "default",
      id: "a7f3",
      page: "p1",
      depth: 2,
      path: ["p1", "outer"],
      query: new URLSearchParams("sku=1"),
      headers: { "accept-language": "en" },
      signal: AbortSignal.timeout(1000),
    };
    // The path is what makes a cycle visible before the request is sent.
    expect(request.path).toEqual(["p1", "outer"]);
    expect(request.path).not.toContain(request.id);
    expect(request.depth).toBe(request.path.length);
    expect(request.query.get("sku")).toBe("1");
  });
});
