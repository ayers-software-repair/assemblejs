// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Rule } from "@assemblejs/mcp";

describe("a rule", () => {
  it("carries the reason, not just the constraint", () => {
    const rule: Rule = {
      id: "x",
      rule: "do this",
      because: "or that happens",
      smell: "looks like",
    };
    // An agent that knows only the rule complies; one that knows why can tell when it is
    // looking at the situation the rule was written for.
    expect(Object.keys(rule).sort()).toEqual(["because", "id", "rule", "smell"]);
  });
});
