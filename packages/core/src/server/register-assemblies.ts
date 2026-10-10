// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { identity } from "../compose/identity.js";
import { renderEnvelope } from "../envelope/render-envelope.js";
import { describeFailure } from "../failure/describe-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { COMPOSITION_HEADER } from "../vocab/composition-header.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import { buildManifest } from "./build-manifest.js";
import { queryOf } from "./query-of.js";
import { readCompositionHeaders } from "./read-composition-headers.js";
import { renderLocal } from "./render-local.js";
import { resolveData } from "./resolve-data.js";

interface Params {
  readonly name: string;
  readonly view?: string;
}

/**
 * Mounts the three endpoints of the assembly contract for every assembly of this server: its
 * content, its data and its manifest, the content at the bare name for the default view.
 *
 * The composition headers are checked on arrival whoever sent them, because there is no
 * privileged variant of a route. An assembly or a view this server does not have is a 404 with
 * an id, and a render that throws is the assembly's fallback under a 500, its cause in the log.
 */
export function registerAssemblies(
  app: FastifyInstance,
  options: {
    readonly assemblies: ReadonlyMap<string, AssemblyDefinition>;
    /** The version of this build's output, sent with every content answer and manifest. */
    readonly version: string;
    /** How many assemblies deep a request may arrive. */
    readonly maxDepth: number;
    readonly log: (line: LogLine) => void;
  },
): void {
  const { assemblies, version, maxDepth, log } = options;

  const resolve = (
    request: FastifyRequest<{ Params: Params }>,
    reply: FastifyReply,
  ): { assembly: AssemblyDefinition; view: string } | undefined => {
    const assembly = assemblies.get(request.params.name);
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
}
