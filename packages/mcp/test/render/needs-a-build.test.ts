// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { needsABuild } from "@assemblejs/mcp";

describe("why a view that is not plain html is not shown", () => {
  it("names the assembly and its renderer, and what to do instead", () => {
    const said = needsABuild("counter", "react");
    expect(said).toContain('"counter" is a react assembly');
    expect(said).toContain("only its renderer turns into markup");
    expect(said).toContain("Build the project");
  });
});
