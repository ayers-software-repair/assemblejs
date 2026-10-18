// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import type { PageDefinition } from "../page/page-definition.js";
import { NotFound } from "../service/not-found.js";
import { pageAnswer } from "./page-answer.js";
import type { PageServing } from "./page-serving.js";
import { queryOf } from "./query-of.js";

/**
 * Mounts each page at its route, answered as `pageAnswer` answers it, with the route's
 * parameters and the request's query. A page a service said not found for is logged, one line
 * naming the route and the service, and answered by `notFound`.
 */
export function registerPages(
  app: FastifyInstance,
  options: PageServing & {
    readonly pages: readonly PageDefinition[];
    /** How a page that is not there is answered: the project's not-found page, if it has one. */
    readonly notFound: (request: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply>;
  },
): void {
  for (const page of options.pages) {
    const answer = pageAnswer(page, page.route, options);
    app.get<{ Params: Record<string, string> }>(page.route, async (request, reply) => {
      try {
        return await answer(request, reply, {
          status: 200,
          params: request.params,
          query: queryOf(request.url),
        });
      } catch (error) {
        if (!(error instanceof NotFound)) throw error;
        options.log({
          correlationId: newCorrelationId(),
          message: `page "${page.route}" answered not found: ${error.message}`,
          stack: undefined,
        });
        return options.notFound(request, reply);
      }
    });
  }
}
