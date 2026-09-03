// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineApi } from "@assemblejs/core";

describe("declaring an api", () => {
  it("returns what it was given", async () => {
    const time = defineApi({ path: "/api/time", handle: () => ({ ok: true }) });
    expect(time.path).toBe("/api/time");
    expect(await time.handle({ query: new URLSearchParams(), params: {} })).toEqual({ ok: true });
  });
});
