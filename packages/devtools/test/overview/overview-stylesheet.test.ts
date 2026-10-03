// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OVERVIEW_STYLESHEET } from "@assemblejs/devtools";

describe("the overview's stylesheet", () => {
  it("is plain CSS that loads nothing else", () => {
    expect(OVERVIEW_STYLESHEET).toContain("table");
    expect(OVERVIEW_STYLESHEET).not.toMatch(/@import|url\(/);
  });
});
