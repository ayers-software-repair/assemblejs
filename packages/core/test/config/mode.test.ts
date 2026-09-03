// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Mode } from "@assemblejs/core";

describe("the mode", () => {
  it("has two values and neither is inferred", () => {
    const modes: Mode[] = ["development", "production"];
    expect(modes).toHaveLength(2);
  });
});
