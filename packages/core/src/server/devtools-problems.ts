// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Devtools } from "../devtools/devtools.js";
import { DEV_RELOAD_SCRIPT } from "../vocab/dev-reload-script.js";
import { DEV_RELOAD_STREAM } from "../vocab/dev-reload-stream.js";
import { DEVTOOLS_ROUTE_PREFIX } from "../vocab/devtools-route-prefix.js";

// The paths under the prefix the server mounts for itself in development.
const RESERVED = new Set(
  [DEV_RELOAD_SCRIPT, DEV_RELOAD_STREAM].map((path) => path.slice(DEVTOOLS_ROUTE_PREFIX.length)),
);

/**
 * Everything wrong with a set of devtools routes, found before anything listens: a path that
 * does not start with a slash would land beside the prefix rather than under it, two routes at
 * one path would disagree about which answers, and the reload paths are the server's own.
 *
 * Where the routes are not mounted (`mounted` false, as in production), the router never sees
 * them, so a route that declares anything but GET is refused here instead: a project boots in
 * both modes or in neither.
 */
export function devtoolsProblems(devtools: Devtools, mounted: boolean): readonly string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const route of devtools.routes) {
    if (!route.path.startsWith("/")) {
      problems.push(`devtools route "${route.path}" does not start with "/"`);
    }
    if (seen.has(route.path))
      problems.push(`devtools route "${route.path}" is declared more than once`);
    if (RESERVED.has(route.path))
      problems.push(`devtools route "${route.path}" is the server's own`);
    if (!mounted && !["GET", "HEAD"].includes(String(route.method))) {
      problems.push(
        `devtools route "${route.path}" answers ${String(route.method)}, and devtools only read`,
      );
    }
    seen.add(route.path);
  }
  return problems;
}
