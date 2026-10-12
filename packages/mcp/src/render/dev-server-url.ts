// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEV_RECORD } from "@assemblejs/cli";
import { FRAMEWORK_ROUTE_PREFIX } from "@assemblejs/core";
import type { ProjectRoot } from "../root/project-root.js";
import { withinRoot } from "../root/within-root.js";
import { ownAddress } from "./own-address.js";

/**
 * The url of the project's own dev server, when one runs: `dev` records it under the root while
 * its server listens, and the server is asked for its health before it is believed, so a record
 * a dead dev left behind is nothing. This is the one address the agent surface reaches, on the
 * developer's machine, and only to show what the project itself serves (DESIGN 13.4, 13.6).
 *
 * The record is a file under the project, whoever wrote it. So the address in it is believed
 * only where it is this machine's own, plain http on a loopback name or on an address of one of
 * its interfaces, and is not asked for otherwise; and the health it answers is believed only
 * where it is the framework's, since another program on the port a dev server left may answer
 * any path with a 200.
 */
export async function devServerUrl(root: ProjectRoot): Promise<string | undefined> {
  const file = join(root.path, DEV_RECORD);
  if (!withinRoot(root, file)) return undefined;
  let url: string;
  try {
    const record: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (typeof record !== "object" || record === null || !("url" in record)) return undefined;
    if (typeof record.url !== "string") return undefined;
    url = record.url;
  } catch {
    return undefined;
  }
  try {
    const recorded = new URL(url);
    if (recorded.protocol !== "http:" || !ownAddress(recorded.host)) return undefined;
    const health = await fetch(`${url}${FRAMEWORK_ROUTE_PREFIX}/health`, {
      signal: AbortSignal.timeout(1000),
    });
    if (!health.ok) return undefined;
    const said = (await health.json()) as { readonly status?: unknown } | null;
    return said?.status === "ok" ? url : undefined;
  } catch {
    return undefined;
  }
}
