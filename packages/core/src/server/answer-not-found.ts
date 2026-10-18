// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest } from "fastify";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import type { PageDefinition } from "../page/page-definition.js";
import { NotFound } from "../service/not-found.js";
import { pageAnswer } from "./page-answer.js";
import type { PageServing } from "./page-serving.js";

/**
 * How the server says a page is not there: with the project's not-found page, composed like any
 * page with no route parameters and no query, under a 404. A project with none, and a request
 * that is not a GET or a HEAD, is answered with the failure body. The not-found page cannot say
 * not found itself: a service of its own that does is logged and answered with the failure body.
 */
export function answerNotFound(
  page: Omit<PageDefinition, "route"> | undefined,
  serving: PageServing,
): (request: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply> {
  const answer = page === undefined ? undefined : pageAnswer(page, "not-found", serving);
  return async (request, reply) => {
    if (answer === undefined || (request.method !== "GET" && request.method !== "HEAD")) {
      return reply.code(404).send(renderFailure(newCorrelationId()));
    }
    try {
      return await answer(request, reply, {
        status: 404,
        params: {},
        query: new URLSearchParams(),
      });
    } catch (error) {
      if (!(error instanceof NotFound)) throw error;
      const correlationId = newCorrelationId();
      serving.log({
        correlationId,
        message: `the not-found page said not found itself: ${error.message}`,
        stack: undefined,
      });
      return reply.code(404).send(renderFailure(correlationId));
    }
  };
}
