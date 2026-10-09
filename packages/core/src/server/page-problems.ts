// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { findPlacements } from "../compose/find-placements.js";
import type { PageDefinition } from "../page/page-definition.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";
import { opensRuntime } from "./opens-runtime.js";
import { pageRouteProblems } from "./page-route-problems.js";
import type { PlacedAssembly } from "./placed-assembly.js";
import { placementProblems } from "./placement-problems.js";
import { remotePlacementProblems } from "./remote-placement-problems.js";
import { routeKey } from "./route-key.js";
import { streamPaths } from "./stream-paths.js";
import { streamProblems } from "./stream-problems.js";

/**
 * Everything wrong with a set of pages, found before anything listens.
 *
 * A placement from another server must name a declared remote's content endpoint, so an origin
 * nobody listed is a refusal here rather than a request at render time, and it cannot sit inside
 * one of the page's forms. A template is read here, at boot, so a name with no assembly behind
 * it is a refusal and not a blank space a visitor discovers; the same goes for policy written
 * for a placement the template does not make, or that the server could not act on
 * (`placementProblems`, which `check` reads the files by). A page's stream must be one of this
 * server's streaming apis, opened by an assembly of this server's that runs in the browser.
 */
export function pageProblems(
  pages: readonly PageDefinition[],
  assemblies: readonly AssemblyDefinition[],
  apis: readonly ApiDefinition[],
  remotes: readonly RemoteDefinition[] = [],
): readonly string[] {
  const problems: string[] = [];
  const placeable = new Map<string, PlacedAssembly>(
    assemblies.map((assembly) => [
      assembly.name,
      {
        views: Object.keys(assembly.views),
        browserHalf: assembly.mount !== "none" && (assembly.assets?.js.length ?? 0) > 0,
      },
    ]),
  );
  const taken = new Set(
    apis.filter((api) => (api.method ?? "GET") === "GET").map((api) => routeKey("GET", api.path)),
  );
  const seen = new Set<string>();
  const streams = streamPaths(apis);
  const origins = new Set(remotes.map((remote) => remote.origin));

  for (const page of pages) {
    const at = `page "${page.route}"`;
    problems.push(...pageRouteProblems(page.route));
    const key = routeKey("GET", page.route);
    if (seen.has(key)) problems.push(`${at} is declared more than once`);
    if (taken.has(key)) problems.push(`${at} is also declared as an api`);
    seen.add(key);

    let placements;
    try {
      placements = findPlacements(page.template);
    } catch (error) {
      problems.push(`${at}: ${error instanceof Error ? error.message : String(error)}`);
      // With no placements to read, the stream's path is still held; what would open it is not.
      problems.push(...streamProblems(at, page.stream, streams, undefined));
      continue;
    }

    const place: Readonly<Record<string, unknown>> = page.place ?? {};
    for (const placement of placements) {
      const policy = Object.hasOwn(place, placement.name) ? place[placement.name] : undefined;
      const url =
        typeof policy === "object" && policy !== null
          ? (policy as { readonly url?: string }).url
          : undefined;
      if (url === undefined) continue;
      problems.push(
        ...remotePlacementProblems(at, page.template, placement, url, origins).map(
          (problem) => problem.message,
        ),
      );
    }
    problems.push(
      ...placementProblems(at, placements, place, placeable).map((problem) => problem.message),
      ...streamProblems(at, page.stream, streams, opensRuntime(placements, place, placeable)),
    );
  }
  return problems;
}
