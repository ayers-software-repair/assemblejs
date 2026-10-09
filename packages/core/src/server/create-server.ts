// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import { contentSecurityPolicy } from "../access/content-security-policy.js";
import { registerAccess } from "../access/register-access.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { DEFAULT_LIMITS } from "../compose/default-limits.js";
import { identity } from "../compose/identity.js";
import { readConfig } from "../config/read-config.js";
import { renderEnvelope } from "../envelope/render-envelope.js";
import { describeFailure } from "../failure/describe-failure.js";
import { exitOnUnhandled } from "../failure/exit-on-unhandled.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { createRemoteTransport } from "../remote/create-remote-transport.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { ASSET_ROUTE_PREFIX } from "../vocab/asset-route-prefix.js";
import { COMPOSITION_HEADER } from "../vocab/composition-header.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";
import { accessProblems } from "./access-problems.js";
import type { App } from "./app.js";
import { assetProblems } from "./asset-problems.js";
import { BootError } from "./boot-error.js";
import { bootProblems } from "./boot-problems.js";
import { buildManifest } from "./build-manifest.js";
import { createMemoryCache } from "./create-memory-cache.js";
import { devtoolsProblems } from "./devtools-problems.js";
import { devtoolsWrites } from "./devtools-writes.js";
import { listAssets } from "./list-assets.js";
import { localFetch } from "./local-fetch.js";
import { queryOf } from "./query-of.js";
import { readCompositionHeaders } from "./read-composition-headers.js";
import { recentFailures } from "./recent-failures.js";
import { registerApis } from "./register-apis.js";
import { registerAssets } from "./register-assets.js";
import { registerDevReload } from "./register-dev-reload.js";
import { registerDevtools } from "./register-devtools.js";
import { registerFailures } from "./register-failures.js";
import { registerPages } from "./register-pages.js";
import { registerStreams } from "./register-streams.js";
import { renderLocal } from "./render-local.js";
import { resolveData } from "./resolve-data.js";
import type { ServerOptions } from "./server-options.js";
import { summarizeProject } from "./summarize-project.js";
import { writeLogLine } from "./write-log-line.js";

interface Params {
  readonly name: string;
  readonly view?: string;
}

/**
 * Builds the server. Everything that can refuse refuses here, before anything listens.
 *
 * The three endpoints of the assembly contract, and nothing else on `/assembly`: anything else
 * under either reserved prefix is a 404, whatever product route might otherwise have matched it.
 * The framework's own routes live under their reserved prefix, so a product route can never
 * collide with one a later version adds. The product's own apis are mounted beside them, refused
 * at boot if one would land under either prefix.
 */
export async function createServer(options: ServerOptions): Promise<App> {
  const config = options.config ?? readConfig(process.env);
  const apis = options.apis ?? [];
  const pages = options.pages ?? [];
  const remotes = options.remotes ?? [];
  const files =
    options.assets === undefined ? new Map<string, string>() : listAssets(options.assets);
  const problems = [
    ...bootProblems(options.assemblies, apis, pages, remotes),
    ...assetProblems(options.assemblies, files),
    ...accessProblems(
      config.auth,
      options.authenticate,
      options.publicRoutes ?? [],
      options.contentSecurityPolicy,
    ),
    ...(options.devtools === undefined
      ? []
      : devtoolsProblems(options.devtools, config.mode === "development")),
  ];
  if (problems.length > 0) throw new BootError(problems);

  const version = options.version ?? "dev";
  const maxDepth = options.maxDepth ?? 8;
  const byName = new Map(options.assemblies.map((assembly) => [assembly.name, assembly]));

  const development = config.mode === "development";
  // In development, every failure is also kept for devtools to show, a bounded number of them.
  const failures = recentFailures();
  const log = (line: LogLine): void => {
    if (development) failures.record(line);
    (options.log ?? writeLogLine)(line);
  };
  // One id per process, which the pages it renders carry and its reload stream tells, so a page
  // in development reloads when the server that rendered it has been replaced.
  const boot = development ? randomUUID() : undefined;
  const app = Fastify({ logger: false });
  // Before any route is mounted, so it sees every one, whoever mounts it.
  const writes = devtoolsWrites(app);

  registerFailures(app, log);
  // Before every route: the one decision, and the policy every html answer carries. Health is
  // always public, because a load balancer that cannot read it takes the server out of service;
  // so are the built browser files, which a page on another origin loads to hydrate this
  // server's assemblies, and which hold nothing a visitor's browser is not sent anyway.
  registerAccess(
    app,
    {
      basic: config.auth,
      authenticate: options.authenticate,
      publicRoutes: [
        `${FRAMEWORK_ROUTE_PREFIX}/health`,
        `${ASSET_ROUTE_PREFIX}/*`,
        ...(options.publicRoutes ?? []),
      ],
    },
    options.contentSecurityPolicy ?? contentSecurityPolicy(remotes.map((remote) => remote.origin)),
    log,
  );

  app.get(`${FRAMEWORK_ROUTE_PREFIX}/health`, async () => ({ status: "ok", version }));

  const resolve = (
    request: FastifyRequest<{ Params: Params }>,
    reply: FastifyReply,
  ): { assembly: AssemblyDefinition; view: string } | undefined => {
    const assembly = byName.get(request.params.name);
    const view = request.params.view ?? DEFAULT_VIEW;
    if (assembly === undefined || assembly.views[view] === undefined) {
      void reply.code(404).send(renderFailure(newCorrelationId()));
      return undefined;
    }
    return { assembly, view };
  };

  const composition = (request: FastifyRequest, reply: FastifyReply) => {
    const read = readCompositionHeaders(
      request.headers as Readonly<Record<string, string | undefined>>,
      maxDepth,
    );
    if (!read.ok) {
      void reply.code(400).send({
        error: {
          correlationId: newCorrelationId(),
          headers: read.problems.map((problem) => `${problem.header} ${problem.detail}`),
        },
      });
      return undefined;
    }
    return read.headers;
  };

  const content = async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
    const resolved = resolve(request, reply);
    if (resolved === undefined) return reply;
    const headers = composition(request, reply);
    if (headers === undefined) return reply;
    // A request whose ancestors already include this assembly is a cycle, refused on arrival
    // whoever sent it, as the composer refuses it before it dispatches.
    const itself = identity(resolved.assembly.name, resolved.view);
    if (headers.path.includes(itself)) {
      return reply.code(400).send({
        error: {
          correlationId: newCorrelationId(),
          headers: [`${COMPOSITION_HEADER.path} already holds ${itself}, a cycle`],
        },
      });
    }

    // The same function the composer's local transport calls, which calls the same data
    // function the data endpoint calls: one path from declaration to markup, however reached.
    const id = headers.id ?? newCorrelationId();
    let html: string;
    try {
      html = await renderLocal(
        resolved.assembly,
        resolved.view,
        id,
        queryOf(request.url),
        headers.params,
      );
    } catch (error) {
      // The assembly's fallback, marked with the id its failure is logged against: a 500, so a
      // composing server applies its own policy and caches nothing, with an envelope a bare
      // fetch can read.
      const correlationId = newCorrelationId();
      log(describeFailure(correlationId, error));
      html = renderEnvelope({
        id,
        name: resolved.assembly.name,
        view: resolved.view,
        renderer: resolved.assembly.views[resolved.view]?.renderer ?? "",
        markup: "",
        data: {},
        failed: correlationId,
      });
      void reply.code(500);
    }
    return reply
      .header("content-type", "text/html; charset=utf-8")
      .header("assembly-name", resolved.assembly.name)
      .header("assembly-version", version)
      .send(html);
  };

  app.get<{ Params: Params }>(`${ASSEMBLY_ROUTE_PREFIX}/:name/`, content);
  app.get<{ Params: Params }>(`${ASSEMBLY_ROUTE_PREFIX}/:name/:view/`, content);

  app.get<{ Params: Params }>(
    `${ASSEMBLY_ROUTE_PREFIX}/:name/:view/api/`,
    async (request, reply) => {
      const resolved = resolve(request, reply);
      if (resolved === undefined) return reply;
      const declared = resolved.assembly.views[resolved.view];
      if (declared === undefined) return reply;
      const headers = composition(request, reply);
      if (headers === undefined) return reply;
      return reply.send(
        await resolveData(declared, { query: queryOf(request.url), params: headers.params }),
      );
    },
  );

  app.get<{ Params: Params }>(
    `${ASSEMBLY_ROUTE_PREFIX}/:name/:view/manifest/`,
    async (request, reply) => {
      const resolved = resolve(request, reply);
      if (resolved === undefined) return reply;
      return reply.send(buildManifest(resolved.assembly, resolved.view, version));
    },
  );

  registerApis(app, apis);
  registerStreams(app, apis, log);
  registerAssets(app, files);
  registerPages(app, {
    pages,
    assemblies: byName,
    local: localFetch(byName, log),
    remote: createRemoteTransport({ remotes, maxBytes: DEFAULT_LIMITS.maxBytes, log }),
    remotes,
    cache: createMemoryCache(),
    log,
    ...(boot === undefined ? {} : { reload: boot }),
  });
  if (boot !== undefined) registerDevReload(app, log, boot);
  if (development && options.devtools !== undefined) {
    registerDevtools(app, options.devtools, {
      project: summarizeProject({
        mode: config.mode,
        version,
        assemblies: options.assemblies,
        pages,
        apis,
        remotes,
      }),
      failures: failures.list,
    });
  }
  // Read once the router is ready, as a plugin's routes are mounted only then: nothing under the
  // devtools prefix may write, refused before anything listens.
  await app.ready();
  if (writes().length > 0) {
    await app.close();
    throw new BootError(writes());
  }

  return {
    fastify: app,
    inject: app.inject.bind(app),
    listen: async () => {
      const url = await app.listen({ host: config.host, port: config.port });
      // A listening process is a server: a failure nothing handled ends it, logged.
      exitOnUnhandled(process, log, (code) => process.exit(code));
      return { url };
    },
    close: async () => {
      await app.close();
    },
  };
}
