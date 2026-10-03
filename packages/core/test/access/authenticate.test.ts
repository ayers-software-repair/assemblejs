// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Authenticate } from "@assemblejs/core";

describe("the product's own access check", () => {
  it("answers yes or no for a request, and may take its time", async () => {
    const check: Authenticate = async (request) => request.headers["x-team"] === "shop";
    expect(await check({ method: "GET", path: "/", headers: { "x-team": "shop" } })).toBe(true);
  });
});
