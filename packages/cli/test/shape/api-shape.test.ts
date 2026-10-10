// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ApiShape } from "@assemblejs/cli";

describe("one api as its file says it", () => {
  it("is its file and its route: a path, a method, and whether it streams", () => {
    const api: ApiShape = {
      file: "src/api/prices.api.ts",
      path: "/api/prices",
      method: "GET",
      streams: true,
    };
    expect(Object.keys(api)).toEqual(["file", "path", "method", "streams"]);
  });
});
