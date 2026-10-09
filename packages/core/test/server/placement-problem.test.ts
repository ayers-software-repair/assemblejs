// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PlacementProblem } from "@assemblejs/core";

describe("one thing wrong with a placement", () => {
  it("names what it is about, so a fix can be chosen without reading the message back", () => {
    const problem: PlacementProblem = { name: "cart", about: "view", message: "no such view" };
    expect(["assembly", "view", "policy", "url", "origin", "form"]).toContain(problem.about);
  });
});
