// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { BootError } from "@assemblejs/core";

describe("a boot error", () => {
  it("carries every problem", () => {
    const error = new BootError(["one", "two"]);
    expect(error.problems).toHaveLength(2);
    expect(error.message).toContain("one");
  });
});
