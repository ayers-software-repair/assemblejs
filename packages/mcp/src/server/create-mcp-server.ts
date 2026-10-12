// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { AGENT_SERVER, ownVersion } from "@assemblejs/cli";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectRoot } from "../root/project-root.js";
import { registerAuthoringTools } from "./register-authoring-tools.js";
import { registerPrompts } from "./register-prompts.js";
import { registerResources } from "./register-resources.js";
import { registerSeeingTools } from "./register-seeing-tools.js";

/**
 * The agent surface, wired to the protocol.
 *
 * Everything here is a thin binding over functions that are tested without it: the protocol is
 * a transport, and a transport is not where behaviour should live. Nothing in this file runs a
 * shell, publishes, deploys, or reaches a network, and nothing holds a credential.
 */
export function createMcpServer(root: ProjectRoot): McpServer {
  const server = new McpServer({ name: AGENT_SERVER.name, version: ownVersion(import.meta.url) });

  registerResources(server, root);

  registerSeeingTools(server, root);
  registerAuthoringTools(server, root);
  registerPrompts(server);
  return server;
}
