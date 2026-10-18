// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import type { ApiDefinition } from "../api/api-definition.js";
import { isReply } from "../api/is-reply.js";
import { isStreamApi } from "../api/is-stream-api.js";
import { readCookies } from "../api/read-cookies.js";
import { writeCookie } from "../api/write-cookie.js";
import type { JsonValue } from "../json/json-value.js";
import { headersOf } from "./headers-of.js";
import { queryOf } from "./query-of.js";

/**
 * Mounts each api that answers with data as a route that replies JSON; a streaming api is left
 * to `registerStreams`.
 *
 * The reply is serialised here rather than handed to the router, because the router sends a bare
 * string as plain text: a handler that returns `"ok"` answers the JSON string `"ok"`, the same
 * type it declared. A plain-JavaScript handler that returns nothing answers `null`, never an
 * empty body labelled JSON. A handler that throws reaches the server's one error handler, so its
 * message never reaches a body.
 *
 * An api is handed who is asking: the request's headers and cookies. What it answers with
 * `reply(...)` is sent as it says: the status, each header, each cookie as a `set-cookie` header
 * of its own, and a body as JSON or no body at all.
 */
export function registerApis(app: FastifyInstance, apis: readonly ApiDefinition[]): void {
  for (const api of apis) {
    if (isStreamApi(api)) continue;
    app.route({
      method: api.method ?? "GET",
      url: api.path,
      handler: async (request, reply) => {
        const headers = headersOf(request.headers);
        const result = await api.handle({
          query: queryOf(request.url),
          params: request.params as Readonly<Record<string, string>>,
          body: request.body as JsonValue | undefined,
          headers,
          cookies: readCookies(headers["cookie"]),
        });
        if (!isReply(result)) {
          return reply
            .header("content-type", "application/json; charset=utf-8")
            .send(JSON.stringify(result ?? null));
        }
        reply.code(result.status).headers(result.headers);
        for (const [name, cookie] of Object.entries(result.cookies)) {
          reply.header("set-cookie", writeCookie(name, cookie));
        }
        if (result.body === undefined) return reply.send();
        return reply
          .header("content-type", "application/json; charset=utf-8")
          .send(JSON.stringify(result.body));
      },
    });
  }
}
