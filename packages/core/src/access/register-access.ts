// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import type { AccessPolicy } from "./access-policy.js";
import { decideAccess } from "./decide-access.js";

/**
 * Installs the one decision as the first thing every request meets, and the default policy every
 * html answer carries. A refused request is a 401 with the failure body, and, under basic
 * credentials, the challenge a browser answers with a prompt.
 */
export function registerAccess(
  app: FastifyInstance,
  policy: AccessPolicy,
  contentSecurityPolicy: string,
): void {
  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] ?? "/";
    const allowed = await decideAccess(
      {
        method: request.method,
        path,
        headers: request.headers as Record<string, string | undefined>,
      },
      policy,
    );
    if (allowed) return;
    if (policy.authenticate === undefined && policy.basic !== undefined) {
      void reply.header("www-authenticate", 'Basic realm="assemblejs", charset="UTF-8"');
    }
    return reply.code(401).send(renderFailure(newCorrelationId()));
  });
  app.addHook("onSend", async (_request, reply, payload) => {
    void reply.header("x-content-type-options", "nosniff");
    const type = String(reply.getHeader("content-type") ?? "");
    if (type.startsWith("text/html"))
      void reply.header("content-security-policy", contentSecurityPolicy);
    return payload;
  });
}
