// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";
import { answerFailure } from "./answer-failure.js";

/**
 * How the server answers everything it will not serve.
 *
 * What a route threw is answered as every failure is: an id and nothing else. An address no route
 * claims is answered by `notFound`. Any unclaimed path under a reserved prefix is a 404 with the
 * failure body, not a page: static routes outrank parameters, so those answer before a product
 * route that starts with a parameter can.
 * The router is case sensitive, so `/ASSEMBLY/x` is not under the prefix at run time; boot
 * refuses a product route spelled that way, so no product route can claim it either.
 */
export function registerFailures(
  app: FastifyInstance,
  log: (line: LogLine) => void,
  notFound: (request: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply>,
): void {
  app.setErrorHandler(answerFailure(log));
  app.setNotFoundHandler(notFound);
  for (const prefix of [ASSEMBLY_ROUTE_PREFIX, FRAMEWORK_ROUTE_PREFIX]) {
    for (const path of [prefix, `${prefix}/*`]) {
      app.all(path, async (_request, reply) =>
        reply.code(404).send(renderFailure(newCorrelationId())),
      );
    }
  }
}
