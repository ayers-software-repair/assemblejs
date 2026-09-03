// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Diagnostic } from "@assemblejs/core";

describe("a diagnostic", () => {
  it("names which rung of the fallback ladder answered", () => {
    const answered: Diagnostic = {
      name: "cart",
      view: "default",
      id: "a7f3",
      source: "remote",
      ms: 84,
    };
    const fellBack: Diagnostic = {
      name: "cart",
      view: "default",
      id: "a7f3",
      source: "fallback",
      reason: "timeout",
      correlationId: "c-1",
      ms: 501,
    };
    expect(answered.source).toBe("remote");
    expect(fellBack.source).toBe("fallback");
    expect(fellBack.correlationId).toBe("c-1");
  });
});
