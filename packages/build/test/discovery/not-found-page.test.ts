// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { NOT_FOUND_PAGE } from "@assemblejs/build";

describe("the not-found page's name", () => {
  it("is a page directory's name like any other", () => {
    expect(NOT_FOUND_PAGE).toBe("not-found");
  });
});
