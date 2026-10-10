// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import type { DiscoveredPage } from "../discovery/discovered-page.js";
import { readInside } from "../root/read-inside.js";
import { declaredRoute } from "./declared-route.js";
import { readDefaultExport } from "./read-default-export.js";

/**
 * The route a page answers at: the one its own file declares, when it declares one, and the one
 * its directory implies otherwise, as the built server mounts it. Undefined for a route the file
 * computes, which only running the project could tell. Read from the source, never run, and
 * only from inside the project: a declaration that leads out of the root throws, unopened.
 */
export function pageRoute(root: string, page: DiscoveredPage): string | undefined {
  if (page.declaration === undefined) return page.route;
  const file = isAbsolute(page.declaration) ? page.declaration : join(root, page.declaration);
  return declaredRoute(readDefaultExport(readInside(root, file)), page.route);
}
