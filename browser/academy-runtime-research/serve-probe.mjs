// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** An isolated research origin exposing only its fixture and the pinned API's JavaScript. */
export async function serveProbe(apiDirectory) {
  const apiRoot = resolve(apiDirectory, "dist");
  const script = fileURLToPath(new URL("./run-probe.js", import.meta.url));
  const server = createServer(async (request, response) => {
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "GET") {
      response.writeHead(405).end();
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      if (pathname === "/") {
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(`<!doctype html><html lang="en"><meta charset="utf-8">
<title>AssembleJS runtime research</title><h1>Runtime compatibility probe</h1>
<pre id="status">starting</pre><pre id="result"></pre>
<button id="stop" type="button">Stop runtime</button>
<iframe id="preview" title="Generated project preview"></iframe>
<script type="importmap">{"imports":{"@webcontainer/api":"/api/index.js"}}</script>
<script type="module" src="/run-probe.js"></script></html>`);
        return;
      }
      const path =
        pathname === "/run-probe.js" ? script : resolve(apiRoot, `.${pathname.slice(4)}`);
      if (
        pathname !== "/run-probe.js" &&
        (!pathname.startsWith("/api/") || !path.startsWith(`${apiRoot}${sep}`))
      ) {
        response.writeHead(404).end();
        return;
      }
      if (!path.endsWith(".js")) {
        response.writeHead(404).end();
        return;
      }
      const contents = await readFile(path);
      response.setHeader("Content-Type", "text/javascript; charset=utf-8");
      response.end(contents);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", done);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("missing probe port");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((done, reject) => server.close((error) => (error ? reject(error) : done()))),
  };
}
