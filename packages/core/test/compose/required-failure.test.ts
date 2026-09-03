// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RequiredFailure } from "@assemblejs/core";
import type { Diagnostic } from "@assemblejs/core";

describe("a required failure", () => {
  it("carries the diagnostic, so a dead page names its cause", () => {
    const diagnostic: Diagnostic = {
      name: "cart",
      view: "default",
      id: "a7f3",
      source: "fallback",
      reason: "timeout",
      ms: 501,
    };
    const failure = new RequiredFailure(diagnostic);
    expect(failure).toBeInstanceOf(Error);
    expect(failure.diagnostic).toBe(diagnostic);
    expect(failure.message).toContain("cart");
    expect(failure.message).toContain("timeout");
  });
});
