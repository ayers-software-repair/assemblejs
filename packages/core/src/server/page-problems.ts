// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { findPlacements } from "../compose/find-placements.js";
import type { PageDefinition } from "../page/page-definition.js";
import type { PagePlacement } from "../page/page-placement.js";
import { isFlatRoute } from "./is-flat-route.js";
import { reservedPrefix } from "./reserved-prefix.js";
import { routeKey } from "./route-key.js";

/**
 * Everything wrong with a set of pages, found before anything listens.
 *
 * A template is read here, at boot, so a name with no assembly behind it is a refusal and not a
 * blank space a visitor discovers. The same goes for policy written for a placement the template
 * does not make: it would be read by nothing, and the author would believe it applied.
 */
export function pageProblems(
  pages: readonly PageDefinition[],
  assemblies: readonly AssemblyDefinition[],
  apis: readonly ApiDefinition[],
): readonly string[] {
  const problems: string[] = [];
  const byName = new Map(assemblies.map((assembly) => [assembly.name, assembly]));
  const taken = new Set(
    apis.filter((api) => (api.method ?? "GET") === "GET").map((api) => routeKey("GET", api.path)),
  );
  const seen = new Set<string>();

  for (const page of pages) {
    const at = `page "${page.route}"`;
    if (!page.route.startsWith("/")) problems.push(`${at} does not start with "/"`);
    if (page.route.includes("*")) {
      problems.push(`${at} uses a wildcard; routes are a flat table with parameters`);
    } else if (page.route.startsWith("/") && !isFlatRoute(page.route)) {
      problems.push(`${at} is not a flat path of literal segments and whole-segment :parameters`);
    } else if (page.route.includes("/:")) {
      problems.push(
        `${at} has a parameter, which nothing yet carries from a page to the assemblies it places`,
      );
    }
    const reserved = reservedPrefix(page.route);
    if (reserved !== undefined) {
      problems.push(`${at} is under "${reserved}/", which the framework reserves`);
    }
    const key = routeKey("GET", page.route);
    if (seen.has(key)) problems.push(`${at} is declared more than once`);
    if (taken.has(key)) problems.push(`${at} is also declared as an api`);
    seen.add(key);

    let placements;
    try {
      placements = findPlacements(page.template);
    } catch (error) {
      problems.push(`${at}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    const place = page.place ?? {};
    for (const placement of placements) {
      const policy = Object.hasOwn(place, placement.name) ? place[placement.name] : undefined;
      if (policy?.url !== undefined) {
        problems.push(
          `${at} places "${placement.name}" from another server, which this version cannot fetch yet`,
        );
        continue;
      }
      const assembly = byName.get(placement.name);
      if (assembly === undefined) {
        problems.push(`${at} places "${placement.name}", and there is no such assembly`);
      } else if (assembly.views[placement.view] === undefined) {
        problems.push(
          `${at} places "${placement.name}" with a view "${placement.view}" it does not have`,
        );
      }
    }

    const placed = new Set(placements.map((placement) => placement.name));
    for (const [name, policy] of Object.entries(place) as Array<[string, unknown]>) {
      if (typeof policy !== "object" || policy === null) {
        problems.push(`${at} declares policy for "${name}" that is not an object`);
        continue;
      }
      if (!placed.has(name)) {
        problems.push(`${at} declares policy for "${name}", which its template never places`);
      }
      const declared = policy as PagePlacement;
      if (declared.defer === true && declared.required === true) {
        problems.push(`${at} declares "${name}" both deferred and required`);
      }
      if (
        declared.deadline !== undefined &&
        !(Number.isFinite(declared.deadline) && declared.deadline > 0)
      ) {
        problems.push(`${at} gives "${name}" a deadline that is not a positive, finite number`);
      }
    }
  }
  return problems;
}
