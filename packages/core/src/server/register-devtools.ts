// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import type { DevtoolsView } from "../devtools/devtools-view.js";
import type { Devtools } from "../devtools/devtools.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { DEVTOOLS_ROUTE_PREFIX } from "../vocab/devtools-route-prefix.js";
import { loopbackHost } from "./loopback-host.js";

/**
 * Mounts each devtools route under the devtools prefix, answering what it responds from the view
 * it is shown, never cached, and only to a request addressed to this machine's loopback. A route that declares any method but GET is mounted as it says, so
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
      handler: async (request, reply) => {
        // Read from this machine only: what devtools show (failures, their stacks) is not for
        // a page on another site that has pointed its own name at this one.
        if (!loopbackHost(request.headers.host)) {
          return reply.code(404).send(renderFailure(newCorrelationId()));
        }
        const answer = await route.respond(view);
        return reply
          .header("content-type", answer.type)
          .header("cache-control", "no-store")
          .send(answer.body);
      },
    });
  }
}
