// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ProjectSummary } from "@assemblejs/core";

describe("the project as devtools may read it", () => {
  it("is names, routes and settings, which survive being written as JSON", () => {
    const summary: ProjectSummary = {
      mode: "development",
      version: "dev",
      assemblies: [
        { name: "a", views: [{ name: "default", renderer: "html" }], mount: "load", shadow: false },
      ],
      pages: [{ route: "/", stream: undefined }],
      apis: [{ method: "GET", path: "/api/x", streams: false }],
      remotes: [],
    };
    expect(JSON.parse(JSON.stringify(summary))).toEqual({ ...summary, pages: [{ route: "/" }] });
  });
});
