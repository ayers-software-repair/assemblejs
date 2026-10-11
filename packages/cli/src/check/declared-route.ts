// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LiteralValue } from "./literal-value.js";
import { UNWRITTEN } from "./unwritten.js";

/**
 * The route a page's declaration gives it, from what the declaration was read as: the one it
 * writes, the one the page's directory implies where it writes none, and undefined for one only
 * running the project could tell: a route it computes, a declaration it computes whole (a call,
 * a value from elsewhere, or no default export at all, which the build's import would refuse),
 * or an object with a spread among its entries, which may carry the route.
 */
export function declaredRoute(declared: LiteralValue, implied: string): string | undefined {
  if (declared === undefined) return undefined;
  if (declared === null || typeof declared !== "object" || Array.isArray(declared)) return implied;
  const fields = declared as Readonly<Record<string, LiteralValue>> & {
    readonly [UNWRITTEN]?: true;
  };
  if (!("route" in fields)) return fields[UNWRITTEN] === true ? undefined : implied;
  const route = fields["route"];
  return typeof route === "string" ? route : undefined;
}
