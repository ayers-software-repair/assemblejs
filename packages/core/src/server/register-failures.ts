// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import { describeFailure } from "../failure/describe-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";

/**
 * How the server answers everything it will not serve: one failure body, an id and nothing else.
 *
 * A thrown error is logged against the id the visitor is told, and its message never reaches a
 * body. A request the router itself refused (an unsupported body type, a malformed or oversized
 * body) keeps its 4xx, so a caller's mistake is not reported as the server's. An unknown route,
 * and any unclaimed path under a reserved prefix, is a 404: static routes outrank parameters, so
 * those answer before a product route that starts with a parameter can.
 */
export function registerFailures(app: FastifyInstance, log: (line: LogLine) => void): void {
  app.setErrorHandler((error, _request, reply) => {
    const correlationId = newCorrelationId();
    const status =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number(error.statusCode)
        : 500;
    const code = status >= 400 && status < 500 ? status : 500;
    if (code === 500) log(describeFailure(correlationId, error));
    void reply.code(code).send(renderFailure(correlationId));
  });
  app.setNotFoundHandler((_request, reply) => {
    void reply.code(404).send(renderFailure(newCorrelationId()));
  });
  for (const prefix of [ASSEMBLY_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX]) {
    for (const path of [prefix, `${prefix}/*`]) {
      app.all(path, async (_request, reply) =>
        reply.code(404).send(renderFailure(newCorrelationId())),
      );
    }
  }
}
