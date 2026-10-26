// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { AGENT_SERVER, MCP_REGISTRATIONS } from "@asmjs/check";

const by = (path: string) => MCP_REGISTRATIONS.find((registration) => registration.path === path);

describe("where a project registers its agent surface", () => {
  it("is one file per client that reads one, under the key that client lists servers by", () => {
    expect(MCP_REGISTRATIONS.map(({ path, servers }) => [path, servers])).toEqual([
      [".mcp.json", "mcpServers"],
      [".cursor/mcp.json", "mcpServers"],
      [".vscode/mcp.json", "servers"],
      [".gemini/settings.json", "mcpServers"],
      ["opencode.json", "mcp"],
    ]);
  });

  it("starts the server the project installed, with node, over stdio, in every one", () => {
    for (const { entry, path } of MCP_REGISTRATIONS) {
      // One command array where the client takes one, a command and its arguments elsewhere.
      const [command, first] = Array.isArray(entry["command"])
        ? entry["command"]
        : [entry["command"], entry["args"]?.[0]];
      expect(command, path).toBe("node");
      expect(String(first).endsWith(AGENT_SERVER.path), path).toBe(true);
      expect(entry["type"] ?? "stdio", path).toMatch(/^(stdio|local)$/);
    }
  });

  it("names the server from the project's root for the clients that run in it, in their forms", () => {
    expect(by(".gemini/settings.json")?.entry).toEqual({
      command: "node",
      args: [AGENT_SERVER.path],
    });
    expect(by("opencode.json")?.entry).toEqual({
      type: "local",
      command: ["node", AGENT_SERVER.path],
    });
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
