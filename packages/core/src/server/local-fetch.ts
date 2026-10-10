// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { Fetch } from "../compose/fetch.js";
import type { Limits } from "../compose/limits.js";
import { describeFailure } from "../failure/describe-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderLocal } from "./render-local.js";

/**
 * The composer's transport for assemblies declared in this process.
 *
 * It never throws: a render that throws is logged against a correlation id and answered as a
 * failure, so the composer's ladder decides what the visitor sees and the exception's message
 * stays in the log.
 *
 * It hands itself to every render as the way that render's own children are reached, so a child
 * a view places is fetched exactly as a page's placement is, under the server's one cap: the
 * depth and the ancestors the request arrived with are the ones its children are composed from.
 */
export function localFetch(
  assemblies: ReadonlyMap<string, AssemblyDefinition>,
  log: (line: LogLine) => void,
  limits: Limits,
): Fetch {
  const fetch: Fetch = async (request) => {
    const assembly = assemblies.get(request.name);
    if (assembly?.views[request.view] === undefined) {
      return {
        ok: false,
        reason: "status",
        detail: `no assembly "${request.name}" with a view "${request.view}" in this server`,
        correlationId: newCorrelationId(),
      };
    }
    try {
      const rendered = await renderLocal(assembly, request.view, {
        id: request.id,
        page: request.page,
        depth: request.depth,
        path: request.path,
        query: request.query,
        params: request.params,
        fetch,
        assemblies,
        limits,
        signal: request.signal,
        ...(request.count === undefined ? {} : { count: request.count }),
        newId: randomUUID,
        now: () => performance.now(),
      });
      return {
        ok: true,
        html: rendered.html,
        source: "local",
        ...(rendered.diagnostics.length === 0 ? {} : { nested: rendered.diagnostics }),
      };
    } catch (error) {
      const correlationId = newCorrelationId();
      log(describeFailure(correlationId, error));
      return {
        ok: false,
        reason: "status",
        detail: "the assembly threw while rendering",
        correlationId,
      };
    }
  };
  return fetch;
}
