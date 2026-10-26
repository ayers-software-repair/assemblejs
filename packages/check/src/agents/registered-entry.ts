// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { BYTE_ORDER_MARK } from "@asmjs/build";
import { AGENT_SERVER } from "./agent-server.js";
import type { McpRegistration } from "./mcp-registration.js";

/**
 * A registration file as it was read, and this project's agent surface as it stands in it:
 * undefined where the file lists none. A byte order mark the file opens with is passed over, as
 * it is no part of the JSON. Throws for a file that is not a JSON object, which is one this
 * command line cannot add a server to without losing what it could not read.
 */
export function registeredEntry(
  registration: McpRegistration,
  source: string,
): { readonly file: Record<string, unknown>; readonly entry: unknown } {
  const file: unknown = JSON.parse(
    source.startsWith(BYTE_ORDER_MARK) ? source.slice(BYTE_ORDER_MARK.length) : source,
  );
  if (typeof file !== "object" || file === null || Array.isArray(file)) {
    throw new Error("it is not a JSON object");
  }
  const servers = (file as Record<string, unknown>)[registration.servers];
  const entry =
    typeof servers === "object" && servers !== null
      ? (servers as Record<string, unknown>)[AGENT_SERVER.name]
      : undefined;
  return { file: file as Record<string, unknown>, entry };
}
