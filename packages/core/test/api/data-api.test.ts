// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DataApi } from "@assemblejs/core";

describe("an api that answers with data", () => {
  it("answers each request through its handler", async () => {
    const echo: DataApi = {
      path: "/api/echo",
      method: "POST",
      handle: (context) => context.body ?? null,
    };
    const query = new URLSearchParams();
    expect(await echo.handle({ query, params: {}, body: { a: 1 } })).toEqual({ a: 1 });
  });
});
