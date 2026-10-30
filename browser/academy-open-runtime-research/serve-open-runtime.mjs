// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** @param {string} [npmAsset] The real pinned npm delivery, for the install/build scenario. */
export async function serveOpenRuntime(npmAsset) {
  const root = dirname(fileURLToPath(import.meta.resolve("@vivari/core")));
  const run = fileURLToPath(new URL("./run-open-runtime.js", import.meta.url));
  const framework = fileURLToPath(new URL("./run-framework-build.js", import.meta.url));
  const deadline = fileURLToPath(new URL("./bounded-operation.js", import.meta.url));
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
<p>${npmAsset ? "Published framework install/build; no preview acceptance." : "Basic mechanics; no framework or preview acceptance."}</p><a href="/vivari-license.txt">Runtime licence</a>
<pre id="status">starting</pre><pre id="result"></pre>
<script type="importmap">{"imports":{"@vivari/core":"/index.js"}}</script>
<script type="module" src="${npmAsset ? "/run-framework-build.js" : "/run-open-runtime.js"}"></script></html>`);
        return;
      }
      const file =
        path === "/run-open-runtime.js"
          ? run
          : path === "/run-framework-build.js"
            ? framework
            : path === "/bounded-operation.js"
              ? deadline
              : path === "/vendor/npm-pack.bin" && npmAsset
                ? npmAsset
                : path === "/vivari-license.txt"
                  ? notice
                  : resolve(root, "." + path);
      if (
        path !== "/run-open-runtime.js" &&
        path !== "/run-framework-build.js" &&
        path !== "/bounded-operation.js" &&
        !(path === "/vendor/npm-pack.bin" && npmAsset) &&
        path !== "/vivari-license.txt" &&
        (!file.startsWith(root + sep) || !file.endsWith(".js"))
      )
        return void response.writeHead(404).end();
      const contents = await readFile(file);
      response.setHeader(
        "Content-Type",
        file === notice
          ? "text/plain; charset=utf-8"
          : file === npmAsset
            ? "application/octet-stream"
            : "text/javascript; charset=utf-8",
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
