// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";

const RESERVED = [ASSEMBLY_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX];

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
 * Routes are a flat table with parameters. A wildcard is refused because it is a way for two
 * routes to disagree about which one matched, and the reserved prefixes are refused because a
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
