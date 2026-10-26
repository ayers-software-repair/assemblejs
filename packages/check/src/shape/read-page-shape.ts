// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import type { DiscoveredPage } from "@asmjs/build";
import { fromRoot } from "@asmjs/build";
import { NOT_FOUND_PAGE } from "@asmjs/build";
import { readInside } from "@asmjs/build";
import { findPlacements } from "@asmjs/core";
import { declaredRoute } from "../check/declared-route.js";
import { readDefaultExport } from "../check/read-default-export.js";
import { COMPUTED } from "./computed.js";
import { fieldAsWritten } from "./field-as-written.js";
import { fieldsOf } from "./fields-of.js";
import { NO_ROUTE } from "./no-route.js";
import type { PageShape } from "./page-shape.js";
import { UNREAD } from "./unread.js";

/**
 * One page as its sources say it: its route, what its template places and the policy its
 * declaration writes for each placement, read and never run. A value the declaration computes
 * is marked where it stands, and so is everything a file that cannot be read would have said,
 * one that leads out of the project included, which is not opened: neither is left out, and
 * neither stops the rest of the page from being told.
 */
export function readPageShape(root: string, page: DiscoveredPage): PageShape {
  const file = (path: string): string => (isAbsolute(path) ? path : join(root, path));
  let places: PageShape["places"];
  try {
    places = findPlacements(readInside(root, file(page.template))).map(({ name, view }) => ({
      name,
      view,
    }));
  } catch {
    places = UNREAD;
  }
  const name = page.name;
  const template = fromRoot(root, file(page.template));
  // The not-found page has no route, whatever its declaration writes.
  const routed = page.name !== NOT_FOUND_PAGE;
  if (page.declaration === undefined) {
    const route = routed ? page.route : NO_ROUTE;
    return { name, route, template, places, policy: {}, stream: null };
  }
  const declaration = fromRoot(root, file(page.declaration));
  try {
    // Read once, and the route, the policy and the stream all told from that one reading.
    const read = readDefaultExport(readInside(root, file(page.declaration)));
    const declared = fieldsOf(read);
    return {
      name,
      route: routed ? (declaredRoute(read, page.route) ?? COMPUTED) : NO_ROUTE,
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
