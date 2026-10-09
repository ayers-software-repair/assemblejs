// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ProjectProblem } from "@assemblejs/cli";

describe("something wrong with a project", () => {
  it("says where, which rule, what, and what would fix it", () => {
    const problem: ProjectProblem = {
      path: "src/assemblies/Cart",
      rule: "directory-is-an-assembly",
      message: '"Cart" is not a usable assembly name',
      fix: 'rename the directory to "cart"',
    };
    expect(Object.keys(problem).sort()).toEqual(["fix", "message", "path", "rule"]);
  });
});
