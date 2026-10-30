// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Serves the exact published runtime only on the isolated hosted test origin. */
export async function serveOpenRuntime() {
  const root = dirname(fileURLToPath(import.meta.resolve("@vivari/core")));
  const run = fileURLToPath(new URL("./run-open-runtime.js", import.meta.url));
  const notice = fileURLToPath(new URL("./vivari-license.txt", import.meta.url));
  const server = createServer(async (request, response) => {
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "GET") return void response.writeHead(405).end();
    try {
      const path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      if (path === "/") {
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(`<!doctype html><html lang="en"><meta charset="utf-8">
<title>Open runtime mechanics research</title><h1>Basic runtime mechanics</h1>
<p>No framework installation or preview acceptance.</p><a href="/vivari-license.txt">Runtime licence</a>
<pre id="status">starting</pre><pre id="result"></pre>
<script type="importmap">{"imports":{"@vivari/core":"/index.js"}}</script>
<script type="module" src="/run-open-runtime.js"></script></html>`);
        return;
      }
      const file =
        path === "/run-open-runtime.js"
          ? run
          : path === "/vivari-license.txt"
            ? notice
            : resolve(root, "." + path);
      if (
        path !== "/run-open-runtime.js" &&
        path !== "/vivari-license.txt" &&
        (!file.startsWith(root + sep) || !file.endsWith(".js"))
      )
        return void response.writeHead(404).end();
      const contents = await readFile(file);
      response.setHeader(
        "Content-Type",
        file === notice ? "text/plain; charset=utf-8" : "text/javascript; charset=utf-8",
      );
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
  if (address === null || typeof address === "string") throw new Error("missing research port");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((done, reject) => server.close((error) => (error ? reject(error) : done()))),
  };
}
