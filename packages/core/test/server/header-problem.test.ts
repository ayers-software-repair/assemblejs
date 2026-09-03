// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { HeaderProblem } from "@assemblejs/core";

describe("a refused header", () => {
  it("names which header and why", () => {
    const problem: HeaderProblem = { header: "assembly-depth", detail: "is not a whole number" };
    expect(problem.header).toBe("assembly-depth");
  });
});
