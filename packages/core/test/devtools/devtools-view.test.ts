// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DevtoolsView } from "@assemblejs/core";

describe("what a devtools route is handed", () => {
  it("is the project and the failures logged most recently, read when asked", () => {
    let asked = 0;
    const view: DevtoolsView = {
      project: {
        mode: "development",
        version: "dev",
        assemblies: [],
        pages: [],
        apis: [],
        remotes: [],
      },
      failures: () => ((asked += 1), []),
    };
    view.failures();
    expect(asked).toBe(1);
  });
});
