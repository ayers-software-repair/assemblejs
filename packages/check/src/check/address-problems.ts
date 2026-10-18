// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectProblem } from "@assemblejs/build";
import { routeParameters } from "@assemblejs/core";
import type { DeclaredAddresses } from "../perf/declared-addresses.js";
import { addressMatches } from "./address-matches.js";

/** The findings a project's page addresses earn: one missing, one its route does not answer, a stray. */
export function addressProblems(
  pages: ReadonlyArray<{
    readonly name: string;
    readonly route: string | undefined;
    readonly at: string;
  }>,
  read: DeclaredAddresses,
  configFile: string | undefined,
): readonly ProjectProblem[] {
  // At the config, or at the page when the project has none. A computed route vouches for no
  // stray address, and a config that may declare more than was read leaves no page known to
  // lack one.
  const found = (path: string, message: string, fix: string): ProjectProblem => ({
    path,
    rule: "a-page-with-a-parameter-names-an-address",
    message,
    fix,
  });
  if (read.problems.length > 0) {
    return read.problems.map((problem) =>
      found(configFile ?? "", problem, 'write each as a route and a path: { "/p/:sku": "/p/a" }'),
    );
  }
  const problems: ProjectProblem[] = [];
  const withParameters = new Set<string>();
  for (const page of pages) {
    const route = page.route;
    if (route === undefined || routeParameters(route).length === 0) continue;
    withParameters.add(route);
    const example = route.replace(/\/:[^/]+/g, "/example");
    const address = Object.hasOwn(read.addresses, route) ? read.addresses[route] : undefined;
    const at = configFile ?? page.at;
    if (address === undefined) {
      if (read.whole) {
        problems.push(
          found(
            at,
            `page "${page.name}" has a parameter in its route ${route}, and addresses names none to weigh it at`,
            `add ${JSON.stringify(route)}: ${JSON.stringify(example)} to addresses in assemblejs.config.ts`,
          ),
        );
      }
    } else if (!addressMatches(route, address)) {
      problems.push(
        found(
          at,
          `the address "${address}" is not a path the route ${route} answers`,
          `write one with a value for each parameter, such as "${example}"`,
        ),
      );
    }
  }
  if (pages.every((page) => page.route !== undefined)) {
    for (const route of Object.keys(read.addresses)) {
      if (withParameters.has(route)) continue;
      problems.push(
        found(
          configFile ?? "",
          `addresses names ${route}, which no page with a parameter has`,
          "remove it",
        ),
      );
    }
  }
  return problems;
}
