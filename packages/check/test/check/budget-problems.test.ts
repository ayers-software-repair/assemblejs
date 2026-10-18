// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { budgetProblems } from "@assemblejs/check";

describe("the findings a config's budgets earn", () => {
  it("is one finding at the config for each thing wrong, with the fix", () => {
    expect(budgetProblems("/p/assemblejs.config.ts", ["budgets is not an object"])).toEqual([
      {
        path: "/p/assemblejs.config.ts",
        rule: "a-budget-is-whole-bytes",
        message: "budgets is not an object",
        fix: "write budgets as { document, styles, scripts, mount, total }, each a whole number of gzipped bytes above zero",
      },
    ]);
    expect(budgetProblems("/p/assemblejs.config.ts", [])).toEqual([]);
  });
});
