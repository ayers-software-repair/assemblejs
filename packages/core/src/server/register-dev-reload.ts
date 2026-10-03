// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { LogLine } from "../failure/log-line.js";
import { DEV_RELOAD_SCRIPT } from "../vocab/dev-reload-script.js";
import { DEV_RELOAD_STREAM } from "../vocab/dev-reload-stream.js";
import { DEV_RELOAD_SOURCE } from "./dev-reload-source.js";
import { registerStreams } from "./register-streams.js";

/**
 * Mounts what reloads a page in development, under the framework's own prefix and only for
 * reading: the script every page links, and a stream that tells each connection this server's
 * boot, one id per process. Nothing here is mounted in production.
 */
export function registerDevReload(app: FastifyInstance, log: (line: LogLine) => void): void {
  const boot = randomUUID();
  app.get(DEV_RELOAD_SCRIPT, async (_request, reply) =>
    reply
      .header("content-type", "text/javascript; charset=utf-8")
      .header("cache-control", "no-store")
      .send(DEV_RELOAD_SOURCE),
  );
  registerStreams(
    app,
    [{ path: DEV_RELOAD_STREAM, stream: ({ send }) => send("boot", boot) }],
    log,
  );
}
