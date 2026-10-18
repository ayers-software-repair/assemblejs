// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { compose } from "../compose/compose.js";
import { RequiredFailure } from "../compose/required-failure.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import type { PageDefinition } from "../page/page-definition.js";
import { parseContentUrl } from "../remote/parse-content-url.js";
import { DEV_RELOAD_SCRIPT } from "../vocab/dev-reload-script.js";
import { OUTLINE_ROUTE } from "../vocab/outline-route.js";
import { beforeBodyEnd } from "./before-body-end.js";
import { hoistAssets } from "./hoist-assets.js";
import { linkEvents } from "./link-events.js";
import { linkStream } from "./link-stream.js";
import { logFallbacks } from "./log-fallbacks.js";
import { outlineIsland } from "./outline-island.js";
import { pageAccount } from "./page-account.js";
import { pageAssets } from "./page-assets.js";
import { pageFetch } from "./page-fetch.js";
import { pagePlan } from "./page-plan.js";
import type { PageServing } from "./page-serving.js";

/**
 * How one page is answered: compose its template through one transport that renders local
 * placements in this process and fetches remote ones, link the browser files of every assembly
 * it placed (a remote's from its manifest), and send the document under the status asked for.
 * `route` names the page in its log lines and its outline.
 *
 * Of the visitor's request, only the headers a placed remote declared it receives ever reach the
 * composer; whether the visitor may be shown each of this server's assemblies reaches it as a
 * question already bound to them. A required placement that does not answer is the one way a
 * page fails from a child, and it answers 503 with an id, never the cause. Every placement that
 * did not answer is logged against its correlation id, whichever rung of the ladder covered for
 * it. A service that said not found is thrown on, before anything is sent, for the caller to
 * answer.
 *
 * A page that shows its outline links the script that draws it and carries the account of how
 * this request composed it, written after composition and outside everything it placed, so no
 * answer that is kept ever holds a word of it.
 */
export function pageAnswer(
  page: Omit<PageDefinition, "route">,
  route: string,
  serving: PageServing,
): (
  request: FastifyRequest,
  reply: FastifyReply,
  asked: {
    readonly status: number;
    readonly params: Readonly<Record<string, string>>;
    readonly query: URLSearchParams;
  },
) => Promise<FastifyReply> {
  const { assemblies, log } = serving;
  const plan = pagePlan({ ...page, route });
  const fetch = pageFetch(plan, serving.local, serving.remote);
  // Every page names the remotes whose runtimes join its bus, since any page may place one.
  const joining = serving.remotes
    .filter((remote) => remote.events === true)
    .map((remote) => remote.origin);
  const forwarded = new Set(
    Object.values(plan).flatMap((placement) => {
      const origin =
        placement.url === undefined ? undefined : parseContentUrl(placement.url)?.origin;
      return serving.remotes.find((remote) => remote.origin === origin)?.forward ?? [];
    }),
  );

  return async (request, reply, asked) => {
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(request.headers)) {
      if (forwarded.has(name) && typeof value === "string") headers[name] = value;
    }
    // Of this server's assemblies the page places, the visitor is shown those their own
    // addresses would show them (DESIGN 5.2); another server's decide for themselves.
    const admit = serving.admit?.(request.headers as Readonly<Record<string, string | undefined>>);
    // Aborted when the asker leaves, so nothing further is composed for nobody.
    const { signal } = request;
    const began = performance.now();
    let composed;
    try {
      composed = await compose({
        template: page.template,
        plan,
        fetch,
        cache: serving.cache,
        limits: serving.limits,
        page: randomUUID(),
        query: asked.query,
        params: asked.params,
        headers,
        signal,
        ...(admit === undefined ? {} : { admit }),
        newId: randomUUID,
        now: () => performance.now(),
      });
    } catch (error) {
      if (!(error instanceof RequiredFailure)) throw error;
      const correlationId = error.diagnostic.correlationId ?? newCorrelationId();
      log({ correlationId, message: error.message, stack: error.stack });
      return reply.code(503).send(renderFailure(correlationId));
    }

    // How long composing took, and not the linking after it, which may ask another server.
    const ms = performance.now() - began;
    logFallbacks(composed.diagnostics, `on page "${route}"`, log);
    const placed = await pageAssets(composed, plan, assemblies, serving.remote, serving.styles);
    // In development the page also carries the script that reloads it after a restart.
    const reload =
      serving.reload === undefined
        ? []
        : [`${DEV_RELOAD_SCRIPT}?boot=${encodeURIComponent(serving.reload)}`];
    // A page that shows its outline also carries the script that draws it, before any
    // assembly's, so it sees each one mount, and the account of this composition.
    const outline = serving.outline === true ? [OUTLINE_ROUTE.script] : [];
    const assets = { css: placed.css, js: [...reload, ...outline, ...placed.js] };
    const account =
      serving.outline === true
        ? outlineIsland(pageAccount({ route, ms }, composed.diagnostics, plan, assemblies))
        : "";
    return reply
      .code(asked.status)
      .header("content-type", "text/html; charset=utf-8")
      .send(
        linkEvents(
          linkStream(beforeBodyEnd(hoistAssets(composed.html, assets), account), page.stream),
          joining,
        ),
      );
  };
}
