// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ISLAND_SCRIPT_TYPE } from "@assemblejs/core";

describe("the island's script type", () => {
  it("is not executable, so the browser parses nothing in it", () => {
    expect(ISLAND_SCRIPT_TYPE).toBe("application/json");
    expect(ISLAND_SCRIPT_TYPE).not.toContain("javascript");
  });
});
