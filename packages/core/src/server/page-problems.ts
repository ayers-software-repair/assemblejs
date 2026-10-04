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
import { pageRouteProblems } from "./page-route-problems.js";
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
 * one of this server's streaming apis, opened by an assembly of this server's that runs in the
 * browser.
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
    problems.push(...pageRouteProblems(page.route));
    // A query is the stream's own, read from its context; the path names the stream.
    if (page.stream !== undefined && !streams.has(page.stream.split("?")[0] ?? "")) {
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

    // The page's own runtime opens its stream, and is on the page only for an assembly of this
    // server's that has a browser half: without one, the stream is named and never opened.
    const opened = placements.some((placement) => {
      const assembly =
        place[placement.name]?.url === undefined ? byName.get(placement.name) : undefined;
      return (
        assembly !== undefined && assembly.mount !== "none" && (assembly.assets?.js.length ?? 0) > 0
      );
    });
    if (page.stream !== undefined && !opened) {
      problems.push(
        `${at} opens a stream and places no assembly of this server's with a browser half, so nothing would open it`,
      );
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
      // The browser fills a deferred placement from the page's own origin, with this server's
      // runtime: another server's fragment is refused by its same-origin policy, and a page with
      // no assembly of this server's that runs in the browser has no runtime to fetch it. Its
      // deadline and cache would be read by nothing, as the browser fetches it after load.
      if (declared.defer === true && declared.url !== undefined) {
        problems.push(
          `${at} defers "${name}" from another server, which the browser could not fetch across origins`,
        );
      }
      if (declared.defer === true && declared.url === undefined && !opened) {
        problems.push(
          `${at} defers "${name}" and places no assembly of this server's with a browser half, so nothing would fill it`,
        );
      }
      if (
        declared.defer === true &&
        (declared.deadline !== undefined || declared.cache !== undefined)
      ) {
        problems.push(
          `${at} gives deferred "${name}" a deadline or a cache, which nothing reads: the browser fetches it after load`,
        );
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
