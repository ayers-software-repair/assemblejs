// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance } from "fastify";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import type { AccessPolicy } from "./access-policy.js";
import { decideAccess } from "./decide-access.js";

/**
 * Installs the one decision as the first thing every request meets, and the default policy every
 * html answer carries. A refused request is a 401 with the failure body, and, under basic
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
    const path = request.url.split("?")[0] ?? "/";
    // Minted only for a request that is refused, or whose check broke: the one id both the body
    // and the log line carry.
    let correlationId: string | undefined;
    const idOf = (): string => (correlationId ??= newCorrelationId());
    const allowed = await decideAccess(
      {
        method: request.method,
        path,
        headers: request.headers as Record<string, string | undefined>,
      },
      policy,
      (error) =>
        log({
          correlationId: idOf(),
          message: `the authenticate check threw: ${error instanceof Error ? error.message : String(error)}`,
          stack: error instanceof Error ? error.stack : undefined,
        }),
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
