// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** A GET-only hosted research fixture; no checkout or writable HTTP route is exposed. */
export async function serveEmbed() {
  const sdk = dirname(fileURLToPath(import.meta.resolve("@stackblitz/sdk")));
  const files = {
    "/sdk.m.js": join(sdk, "sdk.m.js"),
    "/run-embed.js": fileURLToPath(new URL("./run-embed.js", import.meta.url)),
    "/project-probe.mjs": fileURLToPath(new URL("./project-probe.mjs", import.meta.url)),
  };
  const server = createServer(async (request, response) => {
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "GET") return void response.writeHead(405).end();
    try {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      if (path === "/") {
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(`<!doctype html><html lang="en"><meta charset="utf-8">
<title>AssembleJS editor SDK research</title><h1>Public editor SDK compatibility</h1>
<style>pre{max-height:140px;overflow:auto}#embed iframe{width:100%}</style>
<pre id="status">starting</pre><pre id="result"></pre>
<button id="edit" type="button" disabled>Change assembly</button>
<button id="stop" type="button" disabled>Stop project</button>
<div id="embed" style="height:700px"></div>
<script type="importmap">{"imports":{"@stackblitz/sdk":"/sdk.m.js"}}</script>
<script type="module" src="/run-embed.js"></script></html>`);
        return;
      }
      if (!Object.hasOwn(files, path)) return void response.writeHead(404).end();
      response.setHeader("Content-Type", "text/javascript; charset=utf-8");
      response.end(await readFile(files[path]));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", done);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("missing embed port");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((done, reject) => server.close((error) => (error ? reject(error) : done()))),
  };
}
