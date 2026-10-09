// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import type { FastifyInstance } from "fastify";
import { newCorrelationId } from "../failure/new-correlation-id.js";
import { renderFailure } from "../failure/render-failure.js";
import { ASSET_ROUTE_PREFIX } from "../vocab/asset-route-prefix.js";

const TYPES: Readonly<Record<string, string>> = {
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
};

/**
 * Serves the files a build wrote, and nothing else.
 *
 * Every name carries its content hash, so a file is immutable for as long as its url exists and
 * may be cached for a year, and the type is declared, never sniffed. A url not in the boot-time
 * listing is a 404 whatever it contains, its query aside.
 */
export function registerAssets(app: FastifyInstance, files: ReadonlyMap<string, string>): void {
  app.get(`${ASSET_ROUTE_PREFIX}/*`, async (request, reply) => {
    const path = request.url.split("?")[0] ?? "";
    const file = files.get(path);
    if (file === undefined) return reply.code(404).send(renderFailure(newCorrelationId()));
    return (
      reply
        .header("content-type", TYPES[extname(file)] ?? "application/octet-stream")
        .header("x-content-type-options", "nosniff")
        // A page on another origin that places one of this server's assemblies loads these as
        // module scripts, which a browser fetches with CORS. They are public and immutable.
        .header("access-control-allow-origin", "*")
        .header("cache-control", "public, max-age=31536000, immutable")
        .send(await readFile(file))
    );
  });
}
