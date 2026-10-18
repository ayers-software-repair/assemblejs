// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { declaredView } from "../assembly/declared-view.js";
import type { Fetch } from "../compose/fetch.js";
import { identity } from "../compose/identity.js";
import type { Limits } from "../compose/limits.js";
import { renderEnvelope } from "../envelope/render-envelope.js";
import { describeFailure } from "../failure/describe-failure.js";
import type { LogLine } from "../failure/log-line.js";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { NotFound } from "../service/not-found.js";
import { ASSEMBLY_ROUTE_PREFIX } from "../vocab/assembly-route-prefix.js";
import { COMPOSITION_HEADER } from "../vocab/composition-header.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import { RESPONSE_HEADER } from "../vocab/response-header.js";
import type { AdmitVisitor } from "./admit-visitor.js";
import { buildManifest } from "./build-manifest.js";
import { logFallbacks } from "./log-fallbacks.js";
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
 * an id, and so is one whose service says not found; a render that throws, or one whose answer
 * is past the limit on bytes, is the assembly's fallback under a 500, its cause in the log.
 * The content it answers holds every child the assembly's view placed, composed here, each
 * one the visitor asking may be shown.
 */
export function registerAssemblies(
  app: FastifyInstance,
  options: {
    readonly assemblies: ReadonlyMap<string, AssemblyDefinition>;
    /** The version of this build's output, sent with every content answer and manifest. */
    readonly version: string;
    /** The server's bounds: how deep a request may arrive, and how deep its children compose. */
    readonly limits: Limits;
    /** How a child the served assembly's view places is reached: this server's own transport. */
    readonly local: Fetch;
    readonly log: (line: LogLine) => void;
    /** Whether the visitor asking may be shown each child the view places. Everyone, if absent. */
    readonly admit?: AdmitVisitor;
  },
): void {
  const { assemblies, version, limits, local, log } = options;

  const resolve = (
    request: FastifyRequest<{ Params: Params }>,
    reply: FastifyReply,
  ): { assembly: AssemblyDefinition; view: string } | undefined => {
    const assembly = assemblies.get(request.params.name);
    const view = request.params.view ?? DEFAULT_VIEW;
    if (assembly === undefined || declaredView(assembly, view) === undefined) {
      void reply.code(404).send(renderFailure(newCorrelationId()));
      return undefined;
    }
    return { assembly, view };
  };

  const composition = (request: FastifyRequest, reply: FastifyReply) => {
    const read = readCompositionHeaders(
      request.headers as Readonly<Record<string, string | undefined>>,
      limits.depth,
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
    // The depth and the ancestors the request arrived with are the ones its children are
    // composed from, so a parent on another server holds the cap and the cycle across the hop.
    const id = headers.id ?? newCorrelationId();
    // Aborted when the asker leaves, so what its view places stops being composed for nobody.
    const { signal } = request;
    // The visitor this address admitted is shown, of what the view places, what each child's
    // own address would show them, and no more (DESIGN 5.2).
    const admit = options.admit?.(request.headers as Readonly<Record<string, string | undefined>>);
    let html: string;
    try {
      const rendered = await renderLocal(resolved.assembly, resolved.view, {
        id,
        page: headers.page ?? randomUUID(),
        depth: headers.depth,
        path: headers.path,
        query: queryOf(request.url),
        params: headers.params,
        fetch: local,
        assemblies,
        limits,
        signal,
        ...(admit === undefined ? {} : { admit }),
        newId: randomUUID,
        now: () => performance.now(),
      });
      // A child that fell back left its failed envelope inside a parent that still answered 200;
      // its id is found here, in the log of the server that composed it.
      logFallbacks(rendered.diagnostics, `inside "${resolved.assembly.name}"`, log);
      // An answer is under the limit on bytes or it is a failure, here as where it is placed:
      // what a page of this server would refuse of this assembly, its own address refuses.
      if (Buffer.byteLength(rendered.html) > limits.maxBytes) {
        throw new Error(
          `assembly "${resolved.assembly.name}" answered more than ${String(limits.maxBytes)} bytes`,
        );
      }
      html = rendered.html;
    } catch (error) {
      // A service that said not found is answered as a view this server does not have is.
      if (error instanceof NotFound) return reply.code(404).send(renderFailure(newCorrelationId()));
      // The assembly's fallback, marked with the id its failure is logged against: a 500, so a
      // composing server applies its own policy and caches nothing, with an envelope a bare
      // fetch can read.
      const correlationId = newCorrelationId();
      log(describeFailure(correlationId, error));
      html = renderEnvelope({
        id,
        name: resolved.assembly.name,
        view: resolved.view,
        renderer: declaredView(resolved.assembly, resolved.view)?.renderer ?? "",
        markup: "",
        data: {},
        failed: correlationId,
      });
      void reply.code(500);
    }
    return reply
      .header("content-type", "text/html; charset=utf-8")
      .header(RESPONSE_HEADER.name, resolved.assembly.name)
      .header(RESPONSE_HEADER.version, version)
      .send(html);
  };

  app.get<{ Params: Params }>(`${ASSEMBLY_ROUTE_PREFIX}/:name/`, content);
  app.get<{ Params: Params }>(`${ASSEMBLY_ROUTE_PREFIX}/:name/:view/`, content);

  app.get<{ Params: Params }>(
    `${ASSEMBLY_ROUTE_PREFIX}/:name/:view/api/`,
    async (request, reply) => {
      const resolved = resolve(request, reply);
      if (resolved === undefined) return reply;
      const declared = declaredView(resolved.assembly, resolved.view);
      if (declared === undefined) return reply;
      const headers = composition(request, reply);
      if (headers === undefined) return reply;
      try {
        return reply.send(
          await resolveData(declared, { query: queryOf(request.url), params: headers.params }),
        );
      } catch (error) {
        // The same answer the content endpoint gives, since both resolve the same data.
        if (!(error instanceof NotFound)) throw error;
        return reply.code(404).send(renderFailure(newCorrelationId()));
      }
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
