// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import type { AccessPolicy } from "./access-policy.js";
import { checkThrew } from "./check-threw.js";
import { decideAccess } from "./decide-access.js";
import { requestedPath } from "./requested-path.js";

/**
 * Installs the one decision as the first thing every request meets, and the default policy every
 * html answer carries. The decision is made of the path as the router reads it, decoded, so an
 * encoded spelling of a guarded address is that address; a path that does not decode is a 400.
 * A refused request is a 401 with the failure body, and, under basic
 * credentials, the challenge a browser answers with a prompt. A check that threw is logged
 * against the id that body carries (DESIGN 12); a refusal nothing threw for is not a failure and
 * is logged against nothing.
 */
export function registerAccess(
  app: FastifyInstance,
  policy: AccessPolicy,
  contentSecurityPolicy: string,
  log: (line: LogLine) => void = () => undefined,
): void {
  app.addHook("onRequest", async (request, reply) => {
    // Minted only for a request that is refused, or whose check broke: the one id both the body
    // and the log line carry.
    let correlationId: string | undefined;
    const idOf = (): string => (correlationId ??= newCorrelationId());
    const path = requestedPath(request.url);
    if (path === undefined) return reply.code(400).send(renderFailure(idOf()));
    const allowed = await decideAccess(
      {
        method: request.method,
        path,
        headers: request.headers as Record<string, string | undefined>,
      },
      policy,
      (error) => log(checkThrew(idOf(), error)),
    );
    if (allowed) return;
    if (policy.authenticate === undefined && policy.basic !== undefined) {
      void reply.header("www-authenticate", 'Basic realm="assemblejs", charset="UTF-8"');
    }
    return reply.code(401).send(renderFailure(idOf()));
  });
  app.addHook("onSend", async (_request, reply, payload) => {
    void reply.header("x-content-type-options", "nosniff");
    const type = String(reply.getHeader("content-type") ?? "");
    if (type.toLowerCase().startsWith("text/html"))
      void reply.header("content-security-policy", contentSecurityPolicy);
    return payload;
  });
}
