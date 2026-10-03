// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import type { ApiDefinition } from "../api/api-definition.js";
import { isStreamApi } from "../api/is-stream-api.js";
import { describeFailure } from "../failure/describe-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import type { StreamMessage } from "../island/stream-message.js";
import { queryOf } from "./query-of.js";

// A comment line written while a stream is quiet, so a proxy that closes an idle connection
// does not close this one.
const HEARTBEAT_MS = 15_000;
// What a connection may hold unsent before it is closed: a client that stops reading would
// otherwise hold every message sent since in the server's memory.
const MAX_UNSENT_BYTES = 1024 * 1024;

/**
 * Mounts each streaming api as a route that answers server-sent events: one `data:` line of
 * JSON per message, which the browser runtime puts on the page's bus. JSON writes no line break,
 * so a message cannot end early or forge another.
 *
 * A stream that throws is logged against a correlation id and its connection closed, as is one
 * whose client stops reading and lets a megabyte go unsent; the page's event source reconnects. Every open stream is closed before the server stops, which would
 * otherwise wait on connections that never end.
 */
export function registerStreams(
  app: FastifyInstance,
  apis: readonly ApiDefinition[],
  log: (line: LogLine) => void,
  heartbeat = HEARTBEAT_MS,
): void {
  const open = new Set<() => void>();
  app.addHook("preClose", async () => {
    for (const close of [...open]) close();
  });
  for (const api of apis.filter(isStreamApi)) {
    // No HEAD route: a HEAD answer carries no body, so a stream would open and never answer.
    app.get(api.path, { exposeHeadRoute: false }, (request, reply) => {
      reply.hijack();
      const response = reply.raw;
      response.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        "x-content-type-options": "nosniff",
      });
      response.write(": open\n\n");
      const controller = new AbortController();
      const pinging = setInterval(() => response.write(": ping\n\n"), heartbeat);
      const close = (): void => {
        if (controller.signal.aborted) return;
        open.delete(close);
        clearInterval(pinging);
        controller.abort();
        response.end();
      };
      open.add(close);
      response.on("close", close);
      const send = (topic: string, payload: StreamMessage["payload"], to?: StreamMessage["to"]) => {
        if (controller.signal.aborted) return;
        const message: StreamMessage =
          to === undefined ? { topic, payload } : { topic, payload, to };
        response.write(`data: ${JSON.stringify(message)}\n\n`);
        // The page's event source reconnects, and starts again from what the stream sends then.
        if (response.writableLength > MAX_UNSENT_BYTES) close();
      };
      Promise.resolve()
        .then(() =>
          api.stream({
            query: queryOf(request.url),
            params: request.params as Readonly<Record<string, string>>,
            send,
            signal: controller.signal,
          }),
        )
        .catch((error: unknown) => {
          log(describeFailure(newCorrelationId(), error));
          close();
        });
    });
  }
}
