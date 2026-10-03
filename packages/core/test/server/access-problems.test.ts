// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { accessProblems } from "@assemblejs/core";

describe("what is checked about access before anything listens", () => {
  it("passes one control, or none", () => {
    expect(accessProblems(undefined, undefined, ["/health"])).toEqual([]);
    expect(accessProblems({ user: "a", password: "b" }, undefined, [])).toEqual([]);
    expect(accessProblems(undefined, () => true, [])).toEqual([]);
  });

  it("refuses two deciders, and a public route that is not a path", () => {
    expect(accessProblems({ user: "a", password: "b" }, () => true, []).join()).toMatch(
      /one place decides/,
    );
    expect(accessProblems(undefined, undefined, ["health"]).join()).toMatch(/does not start with/);
  });
});
