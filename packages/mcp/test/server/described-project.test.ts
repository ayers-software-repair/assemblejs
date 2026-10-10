// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DescribedProject } from "@assemblejs/mcp";

describe("a project's whole shape as an agent reads it", () => {
  it("is where the project is, and everything its sources say", () => {
    const project: DescribedProject = {
      root: "/work/shop",
      pages: [],
      assemblies: [],
      apis: [],
      settings: {
        remotes: [],
        publicRoutes: [],
        contentSecurityPolicy: null,
        authenticate: false,
        budgets: {},
      },
      renderers: [],
      problems: [],
    };
    expect(Object.keys(project)).toEqual([
      "root",
      "pages",
      "assemblies",
      "apis",
      "settings",
      "renderers",
      "problems",
    ]);
  });
});
