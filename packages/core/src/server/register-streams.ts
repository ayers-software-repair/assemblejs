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
// How long a connection may go without taking what it was sent before it is dropped: a client
// that stops reading would otherwise hold every message sent since in the server's memory. A
// burst a reading client takes in time, however large, is not this.
const STALL_MS = 30_000;

/**
 * Mounts each streaming api as a route that answers server-sent events: one `data:` line of
 * JSON per message, which the browser runtime puts on the page's bus. JSON writes no line break,
 * so a message cannot end early or forge another.
 *
 * A stream that throws is logged against a correlation id and its connection closed. A client
 * whose queue, once past what the socket takes at once, does not drain within the stall time is
 * dropped, its socket destroyed and what was queued for it let go; until then it holds what the
 * stream sent meanwhile. The page's event source reconnects either way. Every open stream is closed before the
 * server stops, which would otherwise wait on connections that never end.
 */
export function registerStreams(
  app: FastifyInstance,
  apis: readonly ApiDefinition[],
  log: (line: LogLine) => void,
  timing: { readonly heartbeat?: number; readonly stall?: number } = {},
): void {
  const { heartbeat = HEARTBEAT_MS, stall = STALL_MS } = timing;
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
      let stalled: ReturnType<typeof setTimeout> | undefined;
      const close = (dropped = false): void => {
        if (controller.signal.aborted) return;
        open.delete(close);
        clearInterval(pinging);
        clearTimeout(stalled);
        controller.abort();
        if (dropped) response.destroy();
        else response.end();
      };
      // A write the socket cannot take at once waits for it to drain; one that does not drain in
      // time is a client that stopped reading.
      const write = (text: string): void => {
        if (response.write(text) || stalled !== undefined) return;
        stalled = setTimeout(() => close(true), stall);
        response.once("drain", () => {
          clearTimeout(stalled);
          stalled = undefined;
        });
      };
      const pinging = setInterval(() => write(": ping\n\n"), heartbeat);
      open.add(close);
      response.on("close", () => close());
      const send = (topic: string, payload: StreamMessage["payload"], to?: StreamMessage["to"]) => {
        if (controller.signal.aborted) return;
        const message: StreamMessage =
          to === undefined ? { topic, payload } : { topic, payload, to };
        write(`data: ${JSON.stringify(message)}\n\n`);
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
