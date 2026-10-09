// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import { describeFailure } from "../failure/describe-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";

// Only the router's own refusals keep their status. An error a product handler throws carries
// whatever statusCode its author or an upstream client set, and a 401 from someone else's API is
// this server's failure to log, not the caller's mistake.
const refusedByTheRouter = (error: unknown): error is { statusCode: number } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof error.code === "string" &&
  error.code.startsWith("FST_") &&
  "statusCode" in error &&
  typeof error.statusCode === "number" &&
  error.statusCode >= 400 &&
  error.statusCode < 500;

/**
 * How the server answers everything it will not serve: one failure body, an id and nothing else.
 *
 * A thrown error is logged against the id the visitor is told, and its message never reaches a
 * body. A request the router itself refused (an unsupported body type, a malformed or oversized
 * body) keeps its 4xx, so a caller's mistake is not reported as the server's. An unknown route,
 * and any unclaimed path under a reserved prefix, is a 404: static routes outrank parameters, so
 * those answer before a product route that starts with a parameter can. The router is case
 * sensitive, so `/ASSEMBLY/x` is not under the prefix at run time; boot refuses a product route
 * spelled that way, so no product route can claim it either.
 */
export function registerFailures(app: FastifyInstance, log: (line: LogLine) => void): void {
  app.setErrorHandler((error, _request, reply) => {
    const correlationId = newCorrelationId();
    const code = refusedByTheRouter(error) ? Number(error.statusCode) : 500;
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
