// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import { DEFAULT_DEADLINE } from "../compose/default-deadline.js";
import { DEFAULT_LIMITS } from "../compose/default-limits.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { mediaType } from "../remote/media-type.js";
import { readCappedBytes } from "../remote/read-capped-bytes.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";
import { RELAY_ROUTE_PREFIX } from "../vocab/relay-route-prefix.js";
import { relayedUrl } from "./relayed-url.js";

// What a browser would show as a page if the relay answered it as sent.
const DOCUMENT_TYPES: ReadonlySet<string> = new Set(["text/html", "application/xhtml+xml"]);

/**
 * Mounts the relay: a call to the api of a remote the project declares, made through this
 * server, so the browser half of a remote's assembly reaches its own server without a request
 * that crosses origins and without the other team changing anything.
 *
 * It passes on the method, the path and query, and a body the router has read (JSON is sent
 * again as JSON), with the content type that goes with it and only the headers the remote is
 * declared to receive: never the visitor's cookie or credential. Redirects are not followed.
 * The answer is capped as a remote assembly's is, and only its status, content type and body
 * come back; every other header it sets is dropped. It is data and never a document on the page's
 * origin: it carries `x-content-type-options: nosniff`, and html is answered as plain text. An origin the project does not declare, and
 * any path outside `/api`, is the 404 every unknown path is. A remote that cannot be reached,
 * is too slow or answers too much is a 502, logged against the id the body carries.
 *
 * The visitor is admitted by the one decision every request meets, of this address: the relay
 * adds no check of its own and opens nothing that decision closes.
 */
export function registerRelay(
  app: FastifyInstance,
  remotes: readonly RemoteDefinition[],
  fetchImpl: typeof fetch = fetch,
  options: { readonly log?: (line: LogLine) => void; readonly maxBytes?: number } = {},
): void {
  const byOrigin = new Map(remotes.map((remote) => [remote.origin, remote]));
  const maxBytes = options.maxBytes ?? DEFAULT_LIMITS.maxBytes;
  app.all(`${RELAY_ROUTE_PREFIX}/:origin/*`, async (request, reply) => {
    const { origin } = request.params as { origin: string };
    const remote = byOrigin.get(origin);
    const target = remote === undefined ? undefined : relayedUrl(origin, request.url);
    if (remote === undefined || target === undefined) {
      return reply.code(404).send(renderFailure(newCorrelationId()));
    }
    const failed = (detail: string) => {
      const correlationId = newCorrelationId();
      options.log?.({
        correlationId,
        message: `remote api ${request.method} ${target.origin}${target.pathname}: ${detail}`,
        stack: undefined,
      });
      return reply.code(502).send(renderFailure(correlationId));
    };

    const headers: Record<string, string> = {};
    for (const key of remote.forward ?? []) {
      const value = request.headers[key];
      if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(", ") : value;
    }
    const carries =
      request.body !== undefined && request.method !== "GET" && request.method !== "HEAD";
    if (carries) headers["content-type"] = request.headers["content-type"] ?? "application/json";
    let response: Response;
    try {
      response = await fetchImpl(target.href, {
        method: request.method,
        headers,
        ...(carries
          ? { body: typeof request.body === "string" ? request.body : JSON.stringify(request.body) }
          : {}),
        redirect: "manual",
        signal: AbortSignal.timeout(DEFAULT_DEADLINE),
      });
    } catch (error) {
      return failed(error instanceof Error ? error.message : String(error));
    }
    const body = await readCappedBytes(response, maxBytes).catch(() => undefined);
    if (body === undefined)
      return failed(`answered ${response.status} with more than ${maxBytes} bytes, or broke`);
    // An api's answer is data, never a document on the page's origin: a remote's markup is shown
    // as text, and no type is guessed from the body.
    const type = response.headers.get("content-type");
    if (DOCUMENT_TYPES.has(mediaType(type)))
      void reply.header("content-type", "text/plain; charset=utf-8");
    else if (type !== null) void reply.header("content-type", type);
    void reply.header("x-content-type-options", "nosniff");
    return reply.code(response.status).send(Buffer.from(body));
  });
}
