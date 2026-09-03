#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolveRoot } from "./root/resolve-root.js";
import { createMcpServer } from "./server/create-mcp-server.js";

// One project root, resolved once from where the server was started, and every tool is scoped
// to it. There is no argument that widens it.
const server = createMcpServer(resolveRoot(process.cwd()));
await server.connect(new StdioServerTransport());
