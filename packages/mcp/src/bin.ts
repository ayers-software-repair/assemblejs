#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isDirectory } from "@assemblejs/cli";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { startedRoot } from "./root/started-root.js";
import { createMcpServer } from "./server/create-mcp-server.js";

// One project root, resolved once from how the server was started, and every tool is scoped to
// it; nothing a tool is given widens it. A root that is no directory is refused here, on the
// stream a client shows its user, before a tool can answer for a project that is not there.
const root = startedRoot(process.argv.slice(2), process.env, process.cwd());
if (isDirectory(root.path)) {
  await createMcpServer(root).connect(new StdioServerTransport());
} else {
  process.stderr.write(
    `assemblejs-mcp: ${root.path} is not a directory. It takes the project's root as its one argument, and works where it is started when given none.\n`,
  );
  process.exitCode = 2;
}
