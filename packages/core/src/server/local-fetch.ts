// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { Fetch } from "../compose/fetch.js";
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
 */
export function localFetch(
  assemblies: ReadonlyMap<string, AssemblyDefinition>,
  log: (line: LogLine) => void,
): Fetch {
  return async (request) => {
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
      const html = await renderLocal(
        assembly,
        request.view,
        request.id,
        request.query,
        request.params,
      );
      return { ok: true, html, source: "local" };
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
}
