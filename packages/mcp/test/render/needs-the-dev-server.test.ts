// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { needsTheDevServer } from "@assemblejs/mcp";

describe("why a framework or template view is refused with no dev server running", () => {
  it("names the assembly and its renderer, and says to start the dev server", () => {
    const said = needsTheDevServer("counter", "react");
    expect(said).toContain('"counter" is a react assembly');
    expect(said).toContain("only its renderer turns into markup");
    expect(said).toContain("npx assemblejs dev");
  });
});
