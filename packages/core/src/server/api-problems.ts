// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";

const RESERVED = [ASSEMBLY_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX];

// A flat path: literal segments and whole-segment parameters, with an optional trailing slash.
// Anything else (an optional or regex parameter, two in one segment, a query or fragment marker)
// either matches differently from how it reads or matches nothing at all.
const SEGMENT = "(?:[A-Za-z0-9._~-]+|:[A-Za-z_][A-Za-z0-9_]*)";
const FLAT = new RegExp(`^/(?:${SEGMENT}(?:/${SEGMENT})*/?)?$`);

// Two paths that differ only in a parameter's name are one route to the router: `/a/:id` and
// `/a/:key` match exactly the same requests, so they collide exactly like identical strings.
const routeKey = (method: string, path: string): string =>
  `${method} ${path.replace(/:[^/]+/g, ":")}`;

const underReserved = (path: string): string | undefined => {
  const lower = path.toLowerCase();
  return RESERVED.find((prefix) => lower === prefix || lower.startsWith(`${prefix}/`));
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
    } else if (api.path.startsWith("/") && !FLAT.test(api.path)) {
      problems.push(
        `api "${api.path}" is not a flat path of literal segments and whole-segment :parameters`,
      );
    }
    const reserved = underReserved(api.path);
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
