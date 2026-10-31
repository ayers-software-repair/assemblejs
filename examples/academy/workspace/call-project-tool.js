// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { projectToolResult } from "./project-tool-result.js";

/** The existing MCP surface returns one JSON text block; malformed replies fail closed. */
export async function callProjectTool(client, name, args = {}) {
  return projectToolResult(await client.callTool({ name, arguments: args }));
}
