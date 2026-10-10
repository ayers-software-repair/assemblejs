// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { findPlacements } from "@assemblejs/core";
import { pageRoute } from "../check/page-route.js";
import { readDefaultExport } from "../check/read-default-export.js";
import type { DiscoveredPage } from "../discovery/discovered-page.js";
import { fromRoot } from "../discovery/from-root.js";
import { COMPUTED } from "./computed.js";
import { fieldAsWritten } from "./field-as-written.js";
import { fieldsOf } from "./fields-of.js";
import type { PageShape } from "./page-shape.js";
import { UNREAD } from "./unread.js";

/**
 * One page as its sources say it: its route, what its template places and the policy its
 * declaration writes for each placement, read and never run. A value the declaration computes
 * is marked where it stands, and so is everything a file that cannot be read would have said:
 * neither is left out, and neither stops the rest of the page from being told.
 */
export function readPageShape(root: string, page: DiscoveredPage): PageShape {
  const file = (path: string): string => (isAbsolute(path) ? path : join(root, path));
  let places: PageShape["places"];
  try {
    places = findPlacements(readFileSync(file(page.template), "utf8")).map(({ name, view }) => ({
      name,
      view,
    }));
  } catch {
    places = UNREAD;
  }
  const name = page.name;
  const template = fromRoot(root, file(page.template));
  if (page.declaration === undefined) {
    return { name, route: page.route, template, places, policy: {}, stream: null };
  }
  const declaration = fromRoot(root, file(page.declaration));
  try {
    const declared = fieldsOf(readDefaultExport(readFileSync(file(page.declaration), "utf8")));
    return {
      name,
      route: pageRoute(root, page) ?? COMPUTED,
      template,
      declaration,
      places,
      policy: declared === undefined ? COMPUTED : fieldAsWritten(declared, "place", {}),
      stream: declared === undefined ? COMPUTED : fieldAsWritten(declared, "stream", null),
    };
  } catch {
    return { name, route: UNREAD, template, declaration, places, policy: UNREAD, stream: UNREAD };
  }
}
