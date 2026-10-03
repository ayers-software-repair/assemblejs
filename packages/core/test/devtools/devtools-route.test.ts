// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DevtoolsRoute } from "@assemblejs/core";

describe("one route devtools serve", () => {
  it("answers a read, at a path under the prefix, from what it is shown", async () => {
    const route: DevtoolsRoute = {
      method: "GET",
      path: "/version",
      respond: (view) => ({ type: "text/plain", body: view.project.version }),
    };
    const project = {
      mode: "development",
      version: "v1",
      assemblies: [],
      pages: [],
      apis: [],
      remotes: [],
    } as const;
    expect((await route.respond({ project, failures: () => [] })).body).toBe("v1");
  });
});
