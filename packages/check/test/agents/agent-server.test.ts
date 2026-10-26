// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { AGENT_SERVER } from "@asmjs/check";

describe("a project's agent surface, as the project meets it", () => {
  it("is registered and announces itself under the framework's own name", () => {
    expect(AGENT_SERVER.name).toBe("assemblejs");
  });

  // Node runs a file: no shell, no package runner, nothing fetched, the same on every platform.
  it("is the entry point its package installs, from the project's root", () => {
    expect(AGENT_SERVER.package).toBe("@asmjs/mcp");
    expect(AGENT_SERVER.path).toBe(`node_modules/${AGENT_SERVER.package}/dist/bin.js`);
  });
});
