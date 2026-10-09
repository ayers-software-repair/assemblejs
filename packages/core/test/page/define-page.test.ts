// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { definePage } from "@assemblejs/core";

describe("declaring a page in its own file", () => {
  it("returns the declaration unchanged", () => {
    const page = { route: "/", place: { cart: { deadline: 500 } } };
    expect(definePage(page)).toBe(page);
  });
});
