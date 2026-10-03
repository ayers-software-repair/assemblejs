// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import { reservedPrefix } from "./reserved-prefix.js";
import { routeKey } from "./route-key.js";

// A flat path: literal segments and whole-segment parameters, with an optional trailing slash.
// Anything else (an optional or regex parameter, two in one segment, a query or fragment marker)
// either matches differently from how it reads or matches nothing at all.
const SEGMENT = "(?:[A-Za-z0-9._~-]+|:[A-Za-z_][A-Za-z0-9_]*)";
const FLAT = new RegExp(`^/(?:${SEGMENT}(?:/${SEGMENT})*/?)?$`);

// "." and ".." are segments a client resolves away before it sends, so a route with one matches
// nothing; a parameter named twice keeps only its last value, silently.
const flat = (path: string): boolean => {
  if (!FLAT.test(path)) return false;
  const segments = path.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) return false;
  const names = segments.filter((segment) => segment.startsWith(":"));
  return new Set(names).size === names.length;
};

/**
 * Everything wrong with a set of api routes, found before anything listens.
 *
 * Routes are a flat table with parameters. A wildcard, and any parameter that is not a whole
 * segment, is refused because it is a way for two routes to disagree about which one matched;
 * within the flat grammar the route key is exact. The reserved prefixes are refused because a
 * product route there would shadow, or be shadowed by, the framework's own.
 */
export function apiProblems(apis: readonly ApiDefinition[]): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const api of apis) {
    const method = api.method ?? "GET";
    if (!api.path.startsWith("/")) {
      problems.push(`api "${api.path}" does not start with "/"`);
    }
    if (api.path.includes("*")) {
      problems.push(`api "${api.path}" uses a wildcard; routes are a flat table with parameters`);
    } else if (api.path.startsWith("/") && !flat(api.path)) {
      problems.push(
        `api "${api.path}" is not a flat path of literal segments and whole-segment :parameters`,
      );
    }
    const reserved = reservedPrefix(api.path);
    if (reserved !== undefined) {
      problems.push(`api "${api.path}" is under "${reserved}/", which the framework reserves`);
    }
    const key = routeKey(method, api.path);
    if (seen.has(key)) {
      problems.push(`api ${method} "${api.path}" is declared more than once`);
    }
    seen.add(key);
  }
  return problems;
}
