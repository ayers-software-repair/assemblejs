// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import { contentSecurityPolicy } from "../access/content-security-policy.js";
import { registerAccess } from "../access/register-access.js";
import { DEFAULT_LIMITS } from "../compose/default-limits.js";
import { readConfig } from "../config/read-config.js";
import { exitOnUnhandled } from "../failure/exit-on-unhandled.js";
import type { LogLine } from "../failure/log-line.js";
import { createRemoteTransport } from "../remote/create-remote-transport.js";
import { ASSET_ROUTE_PREFIX } from "../vocab/asset-route-prefix.js";
import { FRAMEWORK_ROUTE_PREFIX } from "../vocab/framework-route-prefix.js";
import { accessProblems } from "./access-problems.js";
import type { App } from "./app.js";
import { assetProblems } from "./asset-problems.js";
import { BootError } from "./boot-error.js";
import { bootProblems } from "./boot-problems.js";
import { createMemoryCache } from "./create-memory-cache.js";
import { devtoolsProblems } from "./devtools-problems.js";
import { devtoolsWrites } from "./devtools-writes.js";
import { listAssets } from "./list-assets.js";
import { localFetch } from "./local-fetch.js";
import { recentFailures } from "./recent-failures.js";
import { registerApis } from "./register-apis.js";
import { registerAssemblies } from "./register-assemblies.js";
import { registerAssets } from "./register-assets.js";
import { registerDevReload } from "./register-dev-reload.js";
import { registerDevtools } from "./register-devtools.js";
import { registerFailures } from "./register-failures.js";
import { registerPages } from "./register-pages.js";
import { registerStreams } from "./register-streams.js";
import type { ServerOptions } from "./server-options.js";
import { summarizeProject } from "./summarize-project.js";
import { writeLogLine } from "./write-log-line.js";

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
  // One cap for the whole server: what refuses a request on arrival is what its own composer
  // refuses before it dispatches, for a page's placements and for a view's children alike.
  const limits = { ...DEFAULT_LIMITS, depth: options.maxDepth ?? DEFAULT_LIMITS.depth };
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

  // One transport for this server's own assemblies: a page's placements, a view's children and
  // the content endpoint's all reach an assembly through it.
  const local = localFetch(byName, log, limits);
  registerAssemblies(app, { assemblies: byName, version, limits, local, log });
  registerApis(app, apis);
  registerStreams(app, apis, log);
  registerAssets(app, files);
  registerPages(app, {
    pages,
    assemblies: byName,
    local,
    limits,
    remote: createRemoteTransport({ remotes, maxBytes: limits.maxBytes, log }),
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
