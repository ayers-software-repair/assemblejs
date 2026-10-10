// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { McpRegistration } from "@assemblejs/cli";

describe("one file a client reads a project's MCP servers from", () => {
  it("is the file, the key its servers are listed under, and this server's entry", () => {
    const registration: McpRegistration = {
      path: ".mcp.json",
      servers: "mcpServers",
      entry: { command: "node", args: ["server.js"] },
    };
    expect(Object.keys(registration).sort()).toEqual(["entry", "path", "servers"]);
  });
});
