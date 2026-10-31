// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolResult } from "./tool-result.js";

/** A failed write may still leave a partial assembly, so clients must refresh after attempts. */
export function notifyAuthoring(
  server: Pick<McpServer, "sendResourceListChanged">,
  result: ToolResult,
): ToolResult {
  const attempted =
    typeof result.result === "object" && result.result !== null && "attempted" in result.result
      ? result.result.attempted
      : undefined;
  if (result.ok || (Array.isArray(attempted) && attempted.length > 0))
    server.sendResourceListChanged();
  return result;
}
