// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { DiscoveredPage } from "../discovery/discovered-page.js";
import type { LiteralValue } from "./literal-value.js";
import { readDefaultExport } from "./read-default-export.js";

/**
 * The route a page answers at: the one its own file declares, when it declares one, and the one
 * its directory implies otherwise, as the built server mounts it. Undefined for a route the file
 * computes, which only running the project could tell. Read from the source, never run.
 */
export function pageRoute(root: string, page: DiscoveredPage): string | undefined {
  if (page.declaration === undefined) return page.route;
  const file = isAbsolute(page.declaration) ? page.declaration : join(root, page.declaration);
  const declared: LiteralValue = readDefaultExport(readFileSync(file, "utf8"));
  if (declared === null || typeof declared !== "object" || Array.isArray(declared))
    return page.route;
  const fields = declared as Readonly<Record<string, LiteralValue>>;
  if (!("route" in fields)) return page.route;
  const route = fields["route"];
  return typeof route === "string" ? route : undefined;
}
