// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import { DEVTOOLS_ROUTE_PREFIX } from "../vocab/devtools-route-prefix.js";

const READS = new Set(["GET", "HEAD"]);

/**
 * Watches every route mounted from now on, and answers the ones under the devtools prefix that
 * accept anything but a read, whoever mounted them. Devtools run beside an author's code in
 * development, and a route there that writes is a route a page in the same browser can reach.
 */
export function devtoolsWrites(app: FastifyInstance): () => readonly string[] {
  const problems: string[] = [];
  app.addHook("onRoute", (route) => {
    if (!route.url.startsWith(DEVTOOLS_ROUTE_PREFIX)) return;
    const methods = Array.isArray(route.method) ? route.method : [route.method];
    for (const method of methods) {
      if (!READS.has(method)) {
        problems.push(
          `${method} "${route.url}" is under the devtools prefix, where nothing may write`,
        );
      }
    }
  });
  return () => problems;
}
