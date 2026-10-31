// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { previewShimHashes } from "../academy-open-preview-research/preview-shim-hashes.mjs";

/** @param {string} [npmAsset] The real pinned npm delivery.
 * @param {string} [frameworkDirectory] Exact current-source package assets for isolated preview. */
export async function serveOpenRuntime(npmAsset, frameworkDirectory) {
  const preview = frameworkDirectory !== undefined;
  if (preview && !npmAsset) throw new Error("preview requires actual npm delivery");
  const root = dirname(fileURLToPath(import.meta.resolve("@vivari/core")));
  const run = fileURLToPath(new URL("./run-open-runtime.js", import.meta.url));
  const framework = fileURLToPath(new URL("./run-framework-build.js", import.meta.url));
  const deadline = fileURLToPath(new URL("./bounded-operation.js", import.meta.url));
  const notice = fileURLToPath(new URL("./vivari-license.txt", import.meta.url));
  const files = new Map([
    ["/run-open-runtime.js", run],
    ["/run-framework-build.js", framework],
    ["/bounded-operation.js", deadline],
    ["/vivari-license.txt", notice],
    ["/run-built-preview.js", fileURLToPath(new URL("./run-built-preview.js", import.meta.url))],
  ]);
  for (const name of [
    "install-framework-source.js",
    "verify-framework-source.js",
    "sha256.js",
    "framework-packages.js",
  ])
    files.set(
      `/academy-open-preview-research/${name}`,
      fileURLToPath(new URL(`../academy-open-preview-research/${name}`, import.meta.url)),
    );
  files.set("/academy-open-runtime-research/bounded-operation.js", deadline);
  if (npmAsset) files.set("/vendor/npm-pack.bin", npmAsset);
  if (preview) {
    files.set("/sw.js", resolve(root, "assets/sw.js"));
    const inventoryPath = resolve(frameworkDirectory, "framework-source.json");
    const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
    files.set("/framework-source.json", inventoryPath);
    for (const entry of inventory.packages) {
      if (!/^[a-zA-Z0-9.-]+\.tgz$/.test(entry.file)) throw new Error("invalid source package file");
      files.set(`/vendor/framework/${entry.file}`, resolve(frameworkDirectory, entry.file));
    }
    files.set(
      "/preview.css",
      fileURLToPath(new URL("../academy-open-preview-research/preview.css", import.meta.url)),
    );
  }
  const hashes = preview
    ? previewShimHashes(await readFile(resolve(root, "assets/sw.js"), "utf8"))
    : [];
  const server = createServer(async (request, response) => {
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "GET") return void response.writeHead(405).end();
    try {
      const path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
      if (preview && path === "/preview-shims.json") {
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(hashes));
        return;
      }
      if (path === "/") {
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(`<!doctype html><html lang="en"><meta charset="utf-8">
<title>Open runtime mechanics research</title><h1>Basic runtime mechanics</h1>
<p>${preview ? "Current-source build and preview integration; no production adoption." : npmAsset ? "Published framework install/build; no preview acceptance." : "Basic mechanics; no framework or preview acceptance."}</p><a href="/vivari-license.txt">Runtime licence</a>
${preview ? '<p>Isolated built-preview experiment; no production adoption.</p><button type="button" id="stop-preview" disabled>Stop preview</button><link rel="stylesheet" href="/preview.css"><iframe id="preview" title="Built AssembleJS preview"></iframe>' : ""}
<pre id="status">starting</pre><pre id="result"></pre>
<script type="importmap">{"imports":{"@vivari/core":"/index.js"}}</script>
<script type="module" src="${npmAsset ? "/run-framework-build.js" : "/run-open-runtime.js"}"></script></html>`);
        return;
      }
      const file = files.get(path) ?? resolve(root, "." + path);
      if (!files.has(path) && (!file.startsWith(root + sep) || !file.endsWith(".js")))
        return void response.writeHead(404).end();
      const contents = await readFile(file);
      response.setHeader(
        "Content-Type",
        file === notice
          ? "text/plain; charset=utf-8"
          : file === npmAsset || file.endsWith(".tgz")
            ? "application/octet-stream"
            : file.endsWith(".json")
              ? "application/json; charset=utf-8"
              : file.endsWith(".css")
                ? "text/css; charset=utf-8"
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
