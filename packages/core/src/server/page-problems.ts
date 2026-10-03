// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import { isStreamApi } from "../api/is-stream-api.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { findPlacements } from "../compose/find-placements.js";
import type { PageDefinition } from "../page/page-definition.js";
import type { PagePlacement } from "../page/page-placement.js";
import { parseContentUrl } from "../remote/parse-content-url.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";
import { insideForm } from "./inside-form.js";
import { isFlatRoute } from "./is-flat-route.js";
import { reservedPrefix } from "./reserved-prefix.js";
import { routeKey } from "./route-key.js";

/**
 * Everything wrong with a set of pages, found before anything listens.
 *
 * A placement from another server must name a declared remote's content endpoint, so an origin
 * nobody listed is a refusal here rather than a request at render time. A template is read here,
 * at boot, so a name with no assembly behind it is a refusal and not a
 * blank space a visitor discovers. The same goes for policy written for a placement the template
 * does not make: it would be read by nothing, and the author would believe it applied. And a
 * placement from another server cannot sit inside one of the page's forms. A page's stream must be
 * one of this server's streaming apis.
 */
export function pageProblems(
  pages: readonly PageDefinition[],
  assemblies: readonly AssemblyDefinition[],
  apis: readonly ApiDefinition[],
  remotes: readonly RemoteDefinition[] = [],
): readonly string[] {
  const problems: string[] = [];
  const byName = new Map(assemblies.map((assembly) => [assembly.name, assembly]));
  const taken = new Set(
    apis.filter((api) => (api.method ?? "GET") === "GET").map((api) => routeKey("GET", api.path)),
  );
  const seen = new Set<string>();
  // A page's runtime opens its stream by the path as written, so a path with a parameter is one
  // no page can name.
  const streams = new Set(
    apis
      .filter(isStreamApi)
      .map((api) => api.path)
      .filter((path) => !path.includes(":")),
  );

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
    if (page.stream !== undefined && !streams.has(page.stream)) {
      problems.push(
        `${at} opens the stream "${page.stream}", which is not the path of a streaming api without parameters`,
      );
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
        const target = parseContentUrl(policy.url);
        if (target === undefined) {
          problems.push(
            `${at} places "${placement.name}" from ${policy.url}, which is not an assembly's content endpoint (https://host/assembly/<name>/)`,
          );
        } else if (!remotes.some((remote) => remote.origin === target.origin)) {
          problems.push(
            `${at} places "${placement.name}" from ${target.origin}, which is not a declared remote`,
          );
        }
        // A form's end tag in another server's answer would close the page's own form, and the
        // page's fields after it would leave that form.
        if (insideForm(page.template, placement.start)) {
          problems.push(
            `${at} places "${placement.name}" from another server inside a <form>, where its markup could end the page's form`,
          );
        }
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
