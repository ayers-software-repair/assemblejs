// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest } from "fastify";
import { describeFailure } from "../failure/describe-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";

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
 * The one answer to a failure: the failure body, an id and nothing else.
 *
 * A thrown error is logged against the id the visitor is told, and its message never reaches a
 * body. A request the router itself refused (an unsupported body type, a malformed or oversized
 * body, a url that is not one) keeps its 4xx, so a caller's mistake is not reported as the
 * server's.
 *
 * It answers both what a route threw and what the router refused before any route or hook saw
 * the request, so it sets for itself the header that stops a browser guessing a type.
 */
export function answerFailure(
  log: (line: LogLine) => void,
): (error: unknown, request: FastifyRequest, reply: FastifyReply) => void {
  return (error, _request, reply) => {
    const correlationId = newCorrelationId();
    const code = refusedByTheRouter(error) ? error.statusCode : 500;
    if (code === 500) log(describeFailure(correlationId, error));
    void reply
      .code(code)
      .header("x-content-type-options", "nosniff")
      .send(renderFailure(correlationId));
  };
}
