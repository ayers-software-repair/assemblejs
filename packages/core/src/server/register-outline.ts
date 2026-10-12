// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { OUTLINE_ROUTE } from "../vocab/outline-route.js";
import { outlineModuleSource } from "./outline-module-source.js";
import { OUTLINE_SOURCE } from "./outline-source.js";
import { OUTLINE_STYLES } from "./outline-styles.js";

const SCRIPT = "text/javascript; charset=utf-8";

/**
 * Mounts what draws a page's outline, under the framework's own prefix and only for reading:
 * the script a page links, the module it starts and the stylesheet it is drawn with. Mounted
 * only on a server told to show its outline, in development or in production, so on any other
 * server each of these is the 404 every unknown path under the prefix is.
 *
 * They are the framework's own files and hold nothing of the project. A browser asks again
 * each time, so a page is never drawn by a version the server no longer is, and is answered
 * that what it holds is still the file while it is: each is tagged by its content.
 */
export function registerOutline(app: FastifyInstance): void {
  const files: readonly (readonly [string, string, string])[] = [
    [OUTLINE_ROUTE.script, SCRIPT, OUTLINE_SOURCE],
    [OUTLINE_ROUTE.module, SCRIPT, outlineModuleSource()],
    [OUTLINE_ROUTE.stylesheet, "text/css; charset=utf-8", OUTLINE_STYLES],
  ];
  for (const [path, type, body] of files) {
    const tag = `"${createHash("sha256").update(body).digest("base64url").slice(0, 22)}"`;
    app.get(path, async (request, reply) => {
      const answer = reply
        .header("content-type", type)
        .header("x-content-type-options", "nosniff")
        .header("cache-control", "no-cache")
        .header("etag", tag);
      return request.headers["if-none-match"] === tag ? answer.code(304).send() : answer.send(body);
    });
  }
}
