// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import type { DiscoveredPage, ProjectProblem } from "@assemblejs/build";
import { NOT_FOUND_PAGE } from "@assemblejs/build";
import { readInside } from "@assemblejs/build";
import { readDefaultExport } from "./read-default-export.js";

/**
 * A route the not-found page's declaration writes, which is a problem: the page is served at no
 * address of its own, wherever nothing else answers, so the route would answer nothing. Read
 * from the source, never run. A declaration that cannot be read is reported where its
 * placements are read, so it is not reported again here.
 */
export function notFoundRouteProblems(
  root: string,
  page: DiscoveredPage,
): readonly ProjectProblem[] {
  if (page.name !== NOT_FOUND_PAGE || page.declaration === undefined) return [];
  const file = isAbsolute(page.declaration) ? page.declaration : join(root, page.declaration);
  let declared;
  try {
    declared = readDefaultExport(readInside(root, file));
  } catch {
    return [];
  }
  if (typeof declared !== "object" || declared === null || Array.isArray(declared)) return [];
  if (!("route" in declared)) return [];
  return [
    {
      path: page.declaration,
      rule: "the-not-found-page-has-no-route",
      message: `page "${NOT_FOUND_PAGE}" declares a route, and is served at no address of its own`,
      fix: `take the route out of ${NOT_FOUND_PAGE}.page.ts: the page answers wherever nothing else does`,
    },
  ];
}
