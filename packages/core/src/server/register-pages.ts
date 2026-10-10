// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { compose } from "../compose/compose.js";
import type { ContentCache } from "../compose/content-cache.js";
import type { Fetch } from "../compose/fetch.js";
import type { Limits } from "../compose/limits.js";
import { RequiredFailure } from "../compose/required-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import type { PageDefinition } from "../page/page-definition.js";
import { parseContentUrl } from "../remote/parse-content-url.js";
import type { RemoteDefinition } from "../remote/remote-definition.js";
import type { RemoteTransport } from "../remote/remote-transport.js";
import { DEV_RELOAD_SCRIPT } from "../vocab/dev-reload-script.js";
import { hoistAssets } from "./hoist-assets.js";
import { linkStream } from "./link-stream.js";
import { logFallbacks } from "./log-fallbacks.js";
import { pageFetch } from "./page-fetch.js";
import { pagePlan } from "./page-plan.js";
import { queryOf } from "./query-of.js";

/**
 * Mounts each page: compose its template through one transport that renders local placements in
 * this process and fetches remote ones, link the browser files of every assembly it placed (a
 * remote's from its manifest), and answer the document.
 *
 * Of the visitor's request, only the headers a placed remote declared it receives ever reach the
 * composer. A required placement that does not answer is the one way a page fails from a child,
 * and it answers 503 with an id, never the cause. Every placement that did not answer is logged
 * against its correlation id, whichever rung of the ladder covered for it.
 */
export function registerPages(
  app: FastifyInstance,
  options: {
    readonly pages: readonly PageDefinition[];
    readonly assemblies: ReadonlyMap<string, AssemblyDefinition>;
    readonly local: Fetch;
    /** The server's bounds, the same its own assemblies' children are composed under. */
    readonly limits: Limits;
    readonly remote: RemoteTransport;
    readonly remotes: readonly RemoteDefinition[];
    readonly cache: ContentCache;
    readonly log: (line: LogLine) => void;
    /**
     * In development, this server's boot: every page links the script that reloads it, carrying
     * the boot of the server that rendered it.
     */
    readonly reload?: string;
  },
): void {
  const { assemblies, log } = options;
  for (const page of options.pages) {
    const plan = pagePlan(page);
    const fetch = pageFetch(plan, options.local, options.remote);
    const forwarded = new Set(
      Object.values(plan).flatMap((placement) => {
        const origin =
          placement.url === undefined ? undefined : parseContentUrl(placement.url)?.origin;
        return options.remotes.find((remote) => remote.origin === origin)?.forward ?? [];
      }),
    );

    app.get<{ Params: Record<string, string> }>(page.route, async (request, reply) => {
      const headers: Record<string, string> = {};
      for (const [name, value] of Object.entries(request.headers)) {
        if (forwarded.has(name) && typeof value === "string") headers[name] = value;
      }
      let composed;
      try {
        composed = await compose({
          template: page.template,
          plan,
          fetch,
          cache: options.cache,
          limits: options.limits,
          page: randomUUID(),
          query: queryOf(request.url),
          params: request.params,
          headers,
          newId: randomUUID,
          now: () => performance.now(),
        });
      } catch (error) {
        if (!(error instanceof RequiredFailure)) throw error;
        const correlationId = error.diagnostic.correlationId ?? newCorrelationId();
        log({ correlationId, message: error.message, stack: error.stack });
        return reply.code(503).send(renderFailure(correlationId));
      }

      const assets: { css: string[]; js: string[] } = {
        css: [],
        js:
          options.reload === undefined
            ? []
            : [`${DEV_RELOAD_SCRIPT}?boot=${encodeURIComponent(options.reload)}`],
      };
      logFallbacks(composed.diagnostics, `on page "${page.route}"`, log);
      for (const diagnostic of composed.diagnostics) {
        const url = Object.hasOwn(plan, diagnostic.name) ? plan[diagnostic.name]?.url : undefined;
        const declared =
          url === undefined
            ? assemblies.get(diagnostic.name)?.assets
            : await options.remote.assets(url);
        // A shadow assembly's styles are linked inside its shadow root, never in the page.
        const shadow = url === undefined && assemblies.get(diagnostic.name)?.shadow === true;
        if (!shadow) assets.css.push(...(declared?.css ?? []));
        assets.js.push(...(declared?.js ?? []));
      }
      return reply
        .header("content-type", "text/html; charset=utf-8")
        .send(linkStream(hoistAssets(composed.html, assets), page.stream));
    });
  }
}
