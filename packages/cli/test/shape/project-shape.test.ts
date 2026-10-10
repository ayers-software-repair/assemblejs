// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ProjectShape } from "@assemblejs/cli";

describe("a project's whole shape", () => {
  it("is what exists, how it is wired, and what is wrong with the tree", () => {
    const empty: ProjectShape = {
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
    expect(Object.keys(empty)).toEqual([
      "pages",
      "assemblies",
      "apis",
      "settings",
      "renderers",
      "problems",
    ]);
  });
});
