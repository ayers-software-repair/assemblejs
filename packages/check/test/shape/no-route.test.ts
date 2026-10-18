// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { NO_ROUTE } from "@assemblejs/check";

describe("the mark on a route a page does not have", () => {
  it("is nothing an author could write as a route", () => {
    expect(NO_ROUTE.startsWith("/")).toBe(false);
  });
});
