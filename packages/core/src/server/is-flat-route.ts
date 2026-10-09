// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Literal segments and whole-segment parameters, with an optional trailing slash. Anything else
// (an optional or regex parameter, two in one segment, a query or fragment marker) either
// matches differently from how it reads or matches nothing at all.
const SEGMENT = "(?:[A-Za-z0-9._~-]+|:[A-Za-z_][A-Za-z0-9_]*)";
const FLAT = new RegExp(`^/(?:${SEGMENT}(?:/${SEGMENT})*/?)?$`);

/**
 * Whether a route is a flat path, the only kind the design allows: within it, two routes that
 * read differently match differently, so the route key is exact. "." and ".." are refused because
 * a client resolves them away before it sends, and a parameter named twice keeps only its last
 * value, silently.
 */
export function isFlatRoute(path: string): boolean {
  if (!FLAT.test(path)) return false;
  const segments = path.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) return false;
  const names = segments.filter((segment) => segment.startsWith(":"));
  return new Set(names).size === names.length;
}
