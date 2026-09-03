// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ConfigError } from "@assemblejs/core";

describe("a configuration error", () => {
  it("carries every problem, so a boot failure is not one restart per variable", () => {
    const error = new ConfigError(["first is wrong", "second is wrong"]);
    expect(error).toBeInstanceOf(Error);
    expect(error.problems).toHaveLength(2);
    expect(error.message).toContain("first is wrong");
    expect(error.message).toContain("second is wrong");
  });
});
