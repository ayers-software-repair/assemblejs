// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import { isStreamApi } from "../api/is-stream-api.js";
import { isFlatRoute } from "./is-flat-route.js";
import { reservedPrefix } from "./reserved-prefix.js";
import { routeKey } from "./route-key.js";

/**
 * Everything wrong with a set of api routes, found before anything listens.
 *
 * Routes are a flat table with parameters. A wildcard, and any parameter that is not a whole
 * segment, is refused because it is a way for two routes to disagree about which one matched;
 * within the flat grammar the route key is exact. The reserved prefixes are refused because a
 * product route there would shadow, or be shadowed by, the framework's own. A stream answers GET,
 * which is all a browser's event source asks.
 */
export function apiProblems(apis: readonly ApiDefinition[]): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const api of apis) {
    const method = api.method ?? "GET";
    if (isStreamApi(api) && method !== "GET") {
      problems.push(`api ${method} "${api.path}" streams, and a stream answers GET`);
    }
    if (!api.path.startsWith("/")) {
      problems.push(`api "${api.path}" does not start with "/"`);
    }
    if (api.path.includes("*")) {
      problems.push(`api "${api.path}" uses a wildcard; routes are a flat table with parameters`);
    } else if (api.path.startsWith("/") && !isFlatRoute(api.path)) {
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
