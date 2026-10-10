// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { AGENT_SERVER, MCP_REGISTRATIONS } from "@assemblejs/cli";

const by = (path: string) => MCP_REGISTRATIONS.find((registration) => registration.path === path);

describe("where a project registers its agent surface", () => {
  it("is one file per client that reads one, under the key that client lists servers by", () => {
    expect(MCP_REGISTRATIONS.map(({ path, servers }) => [path, servers])).toEqual([
      [".mcp.json", "mcpServers"],
      [".cursor/mcp.json", "mcpServers"],
      [".vscode/mcp.json", "servers"],
    ]);
  });

  it("starts the server the project installed, with node, over stdio, in every one", () => {
    for (const { entry, path } of MCP_REGISTRATIONS) {
      expect(entry["type"], path).toBe("stdio");
      expect(entry["command"], path).toBe("node");
      expect(String(entry["args"]?.[0]).endsWith(AGENT_SERVER.path), path).toBe(true);
    }
  });

  // No variable there names the project's root: the server finds it from how it was started.
  it("names the server from the project's root where the client has no word for that root", () => {
    expect(by(".mcp.json")?.entry).toEqual({
      type: "stdio",
      command: "node",
      args: [AGENT_SERVER.path],
    });
  });

  it("names the server in full, and hands it the root, where the client fills its workspace in", () => {
    for (const path of [".cursor/mcp.json", ".vscode/mcp.json"]) {
      expect(by(path)?.entry, path).toEqual({
        type: "stdio",
        command: "node",
        args: [`\${workspaceFolder}/${AGENT_SERVER.path}`, "${workspaceFolder}"],
      });
    }
  });
});
