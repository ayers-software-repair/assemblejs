// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PagePlacement } from "@assemblejs/core";

describe("policy for one placement", () => {
  it("is all optional, because a local placement needs none", () => {
    const none: PagePlacement = {};
    const some: PagePlacement = { deadline: 500, fallback: "<p>Cart unavailable</p>" };
    expect(Object.keys(none)).toEqual([]);
    expect(some.deadline).toBe(500);
  });
});
