// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isFlatRoute } from "@assemblejs/core";

describe("a flat route", () => {
  it("is literal segments and whole-segment parameters, a trailing slash included", () => {
    for (const path of ["/", "/about", "/api/v1.2/items_list/", "/a/:id", "/a/:b/c/:d"]) {
      expect(isFlatRoute(path)).toBe(true);
    }
  });

  it("is not anything that matches differently from how it reads, or matches nothing", () => {
    for (const path of [
      "",
      "a",
      "//x",
      "/a/:id?",
      "/a/:id(^\\d+)",
      "/a/:b-:c",
      "/a/::x",
      "/x?y",
      "/x#y",
      "/./x",
      "/a/..",
      "/a/:id/:id",
      "/a/*",
    ]) {
      expect(isFlatRoute(path)).toBe(false);
    }
  });
});
