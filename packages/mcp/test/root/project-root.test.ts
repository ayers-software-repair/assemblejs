// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { resolveRoot } from "@assemblejs/mcp";
import type { ProjectRoot } from "@assemblejs/mcp";

describe("the project root", () => {
  it("is a branded type, so a bare string cannot stand in for one", () => {
    const root: ProjectRoot = resolveRoot("/tmp/project");
    expect(root.path).toBe("/tmp/project");
    // A path that has not been through resolveRoot cannot be passed where a root is expected,
    // which is what keeps the check from being the easy thing to skip.
    expect(root.__brand).toBe("ProjectRoot");
  });
});
