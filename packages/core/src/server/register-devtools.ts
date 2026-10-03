// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import type { DevtoolsView } from "../devtools/devtools-view.js";
import type { Devtools } from "../devtools/devtools.js";
import { DEVTOOLS_ROUTE_PREFIX } from "../vocab/devtools-route-prefix.js";

/**
 * Mounts each devtools route under the devtools prefix, answering what it responds from the view
 * it is shown, never cached. A route that declares any method but GET is mounted as it says, so
 * the boot assertion over the prefix sees it and refuses the server.
 */
export function registerDevtools(
  app: FastifyInstance,
  devtools: Devtools,
  view: DevtoolsView,
): void {
  for (const route of devtools.routes) {
    app.route({
      method: route.method,
      url: `${DEVTOOLS_ROUTE_PREFIX}${route.path}`,
      handler: async (_request, reply) => {
        const answer = await route.respond(view);
        return reply
          .header("content-type", answer.type)
          .header("cache-control", "no-store")
          .send(answer.body);
      },
    });
  }
}
