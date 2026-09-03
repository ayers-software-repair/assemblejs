// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ServiceOrderError } from "@assemblejs/core";

describe("a service ordering error", () => {
  it("carries every problem, not the first", () => {
    const error = new ServiceOrderError(["one", "two"]);
    expect(error.problems).toHaveLength(2);
    expect(error.message).toContain("two");
  });
});
