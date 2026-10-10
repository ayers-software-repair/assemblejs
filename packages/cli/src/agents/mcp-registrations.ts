// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { AGENT_SERVER } from "./agent-server.js";
import type { McpRegistration } from "./mcp-registration.js";

// What Cursor and VS Code fill in with the folder that holds the file, before the server starts.
const WORKSPACE = "${workspaceFolder}";

// The server named in full and handed the project's root as its one argument, so that it does
// not matter what directory it is started in.
const FROM_ANYWHERE = {
  type: "stdio",
  command: "node",
  args: [`${WORKSPACE}/${AGENT_SERVER.path}`, WORKSPACE],
} as const;

/**
 * Where a project registers its agent surface: one file per client that reads one, each in the
 * form that client's documentation gives (read 2026-10-10; `docs/DECISIONS.md` has the sources).
 *
 * - `.mcp.json`, `mcpServers`: Claude Code's project scope, and the portable form other clients
 *   read. It has no variable for the project's root, so the server is named from where the
 *   client starts it and finds the root itself.
 * - `.cursor/mcp.json`, `mcpServers`, and `.vscode/mcp.json`, `servers`: each client fills its
 *   workspace folder into a server's arguments.
 */
export const MCP_REGISTRATIONS: readonly McpRegistration[] = [
  {
    path: ".mcp.json",
    servers: "mcpServers",
    entry: { type: "stdio", command: "node", args: [AGENT_SERVER.path] },
  },
  { path: ".cursor/mcp.json", servers: "mcpServers", entry: FROM_ANYWHERE },
  { path: ".vscode/mcp.json", servers: "servers", entry: FROM_ANYWHERE },
];
