// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import type { ApiDefinition } from "../api/api-definition.js";
import type { JsonValue } from "../json/json-value.js";
import { queryOf } from "./query-of.js";

/**
 * Mounts each api as a route that replies JSON.
 *
 * The reply is serialised here rather than handed to the router, because the router sends a bare
 * string as plain text: a handler that returns `"ok"` answers the JSON string `"ok"`, the same
 * type it declared. A plain-JavaScript handler that returns nothing answers `null`, never an
 * empty body labelled JSON. A handler that throws reaches the server's one error handler, so its message
 * never reaches a body.
 */
export function registerApis(app: FastifyInstance, apis: readonly ApiDefinition[]): void {
  for (const api of apis) {
    app.route({
      method: api.method ?? "GET",
      url: api.path,
      handler: async (request, reply) => {
        const result = await api.handle({
          query: queryOf(request.url),
          params: request.params as Readonly<Record<string, string>>,
          body: request.body as JsonValue | undefined,
        });
        return reply
          .header("content-type", "application/json; charset=utf-8")
          .send(JSON.stringify(result ?? null));
      },
    });
  }
}
