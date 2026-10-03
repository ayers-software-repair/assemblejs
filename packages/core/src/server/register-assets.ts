// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import type { FastifyInstance } from "fastify";
import { ASSET_ROUTE_PREFIX } from "../vocab/asset-route-prefix.js";

const TYPES: Readonly<Record<string, string>> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/**
 * Serves the files a build wrote, and nothing else.
 *
 * Every name carries its content hash, so a file is immutable for as long as its url exists and
 * may be cached for a year. A url not in the boot-time listing is a 404 whatever it contains.
 */
export function registerAssets(app: FastifyInstance, files: ReadonlyMap<string, string>): void {
  app.get(`${ASSET_ROUTE_PREFIX}/*`, async (request, reply) => {
    const path = request.url.split("?")[0] ?? "";
    const file = files.get(path);
    if (file === undefined) return reply.code(404).send();
    return reply
      .header("content-type", TYPES[extname(file)] ?? "application/octet-stream")
      .header("cache-control", "public, max-age=31536000, immutable")
      .send(await readFile(file));
  });
}
