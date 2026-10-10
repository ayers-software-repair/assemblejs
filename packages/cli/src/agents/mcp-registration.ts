// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** One file a client reads a project's MCP servers from, and this project's server in it. */
export interface McpRegistration {
  /** The file, from the project's root. */
  readonly path: string;
  /** The key that file lists its servers under. */
  readonly servers: "mcpServers" | "servers";
  /** How that client starts the project's agent surface. */
  readonly entry: Readonly<Record<string, string | readonly string[]>>;
}
