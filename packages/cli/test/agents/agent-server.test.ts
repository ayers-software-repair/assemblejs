// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AGENT_SERVER } from "@assemblejs/cli";

describe("a project's agent surface, as the project meets it", () => {
  it("is registered and announces itself under the framework's own name", () => {
    expect(AGENT_SERVER.name).toBe("assemblejs");
  });

  // Node runs a file: no shell, no package runner, nothing fetched, the same on every platform.
  it("is the entry point its package installs, from the project's root", () => {
    expect(AGENT_SERVER.package).toBe("@assemblejs/mcp");
    expect(AGENT_SERVER.path).toBe(`node_modules/${AGENT_SERVER.package}/dist/bin.js`);
  });

  it("is built on the command line, this package, which a project installs beside it", () => {
    const own = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    ) as { name: string };
    expect(AGENT_SERVER.commandLine).toBe(own.name);
  });
});
