// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "./literal-value.js";

/**
 * The route a page's declaration gives it, from what the declaration was read as: the one it
 * writes, the one the page's directory implies where it writes none, and undefined for one it
 * computes, which only running the project could tell.
 */
export function declaredRoute(declared: LiteralValue, implied: string): string | undefined {
  if (declared === null || typeof declared !== "object" || Array.isArray(declared)) return implied;
  const fields = declared as Readonly<Record<string, LiteralValue>>;
  if (!("route" in fields)) return implied;
  const route = fields["route"];
  return typeof route === "string" ? route : undefined;
}
