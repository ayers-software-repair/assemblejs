// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { compose } from "../compose/compose.js";
import type { Fetch } from "../compose/fetch.js";
import { RequiredFailure } from "../compose/required-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import type { PageDefinition } from "../page/page-definition.js";
import { hoistAssets } from "./hoist-assets.js";
import { pagePlan } from "./page-plan.js";

/**
 * Mounts each page: compose its template through the given transport, link the browser files of
 * every assembly it placed, and answer the document.
 *
 * A required placement that does not answer is the one way a page fails from a child, and it
 * answers 503 with an id, never the cause.
 */
export function registerPages(
  app: FastifyInstance,
  pages: readonly PageDefinition[],
  assemblies: ReadonlyMap<string, AssemblyDefinition>,
  fetch: Fetch,
  log: (line: LogLine) => void,
): void {
  for (const page of pages) {
    const plan = pagePlan(page);
    app.get(page.route, async (request, reply) => {
      const at = request.url.indexOf("?");
      let composed;
      try {
        composed = await compose({
          template: page.template,
          plan,
          fetch,
          page: randomUUID(),
          query: new URLSearchParams(at === -1 ? "" : request.url.slice(at)),
          newId: randomUUID,
          now: () => performance.now(),
        });
      } catch (error) {
        if (!(error instanceof RequiredFailure)) throw error;
        const correlationId = error.diagnostic.correlationId ?? newCorrelationId();
        log({ correlationId, message: error.message, stack: error.stack });
        return reply.code(503).send(renderFailure(correlationId));
      }

      const assets: { css: string[]; js: string[] } = { css: [], js: [] };
      for (const diagnostic of composed.diagnostics) {
        const declared: AssemblyAssets | undefined = assemblies.get(diagnostic.name)?.assets;
        assets.css.push(...(declared?.css ?? []));
        assets.js.push(...(declared?.js ?? []));
      }
      return reply
        .header("content-type", "text/html; charset=utf-8")
        .send(hoistAssets(composed.html, assets));
    });
  }
}
