// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { renderEnvelope } from "../envelope/render-envelope.js";
import { describeFailure } from "../failure/describe-failure.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";
import type { App } from "./app.js";
import { BootError } from "./boot-error.js";
import { bootProblems } from "./boot-problems.js";
import { buildManifest } from "./build-manifest.js";
import { readCompositionHeaders } from "./read-composition-headers.js";
import { resolveData } from "./resolve-data.js";
import type { ServerOptions } from "./server-options.js";

interface Params {
  readonly name: string;
  readonly view?: string;
}

/**
 * Builds the server. Everything that can refuse refuses here, before anything listens.
 *
 * The three endpoints of the assembly contract, and nothing else on `/assembly`. The framework's
 * own routes live under their reserved prefix, so a product route can never collide with one a
 * later version adds.
 */
export async function createServer(options: ServerOptions): Promise<App> {
  const problems = bootProblems(options.assemblies);
  if (problems.length > 0) throw new BootError(problems);

  const version = options.version ?? "dev";
  const maxDepth = options.maxDepth ?? 8;
  const byName = new Map(options.assemblies.map((assembly) => [assembly.name, assembly]));

  const app = Fastify({ logger: false });

  // One error handler. The visitor is told an id; the log holds what actually happened. An
  // exception's message never reaches a body, whatever threw and wherever.
  app.setErrorHandler((error, _request, reply) => {
    const correlationId = newCorrelationId();
    const line = describeFailure(correlationId, error);
    app.log.error(line);
    void reply.code(500).send(renderFailure(correlationId));
  });

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

  const queryOf = (request: FastifyRequest): URLSearchParams =>
    new URLSearchParams(
      request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "",
    );

  const content = async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
    const resolved = resolve(request, reply);
    if (resolved === undefined) return reply;
    const headers = composition(request, reply);
    if (headers === undefined) return reply;

    const declared = resolved.assembly.views[resolved.view];
    if (declared === undefined) return reply;

    // The same data function the data endpoint calls. One function, two endpoints, so the
    // contract's promise that they never drift is structural rather than a convention.
    const data = await resolveData(declared, { query: queryOf(request), params: {} });
    const markup = await declared.markup({ data, children: {} });

    return reply
      .header("content-type", "text/html; charset=utf-8")
      .header("assembly-name", resolved.assembly.name)
      .header("assembly-version", version)
      .send(
        renderEnvelope({
          id: headers.id ?? newCorrelationId(),
          name: resolved.assembly.name,
          view: resolved.view,
          renderer: declared.renderer,
          markup,
          data,
        }),
      );
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
      return reply.send(await resolveData(declared, { query: queryOf(request), params: {} }));
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

  await app.ready();

  return {
    fastify: app,
    inject: app.inject.bind(app),
    listen: async () => {
      const url = await app.listen({ host: options.config.host, port: options.config.port });
      return { url };
    },
    close: async () => {
      await app.close();
    },
  };
}
