// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "./literal-value.js";
import { readDefaultExport } from "./read-default-export.js";

/**
 * Every remote origin a project's config declares as a literal, in its `remotes`, read without
 * running it. A remote declared some other way is not seen here, and boot still holds every
 * placement to the remotes it really declares.
 */
export function declaredOrigins(source: string): ReadonlySet<string> {
  const found = new Set<string>();
  const config = readDefaultExport(source);
  if (config === null || typeof config !== "object" || Array.isArray(config)) return found;
  const remotes = (config as Record<string, LiteralValue>)["remotes"];
  if (!Array.isArray(remotes)) return found;
  for (const remote of remotes as readonly LiteralValue[]) {
    if (remote === null || typeof remote !== "object" || Array.isArray(remote)) continue;
    const origin = (remote as Record<string, LiteralValue>)["origin"];
    if (typeof origin === "string") found.add(origin);
  }
  return found;
}
