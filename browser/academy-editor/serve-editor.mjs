// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile, mkdtemp, mkdir, cp, rm } from "node:fs/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { build } from "esbuild";
import { readSaveBody } from "./read-save-body.mjs";

/** Hosted UI proof only: actual temporary source files, no simulated framework preview. */
export async function serveEditor() {
  const root = await mkdtemp(join(tmpdir(), "academy-editor-proof-"));
  let server;
  try {
    const paths = ["price-calculator.react.tsx", "request-estimate.ts"];
    const source = resolve("examples/market/shop/src/assemblies/price-calculator");
    await mkdir(join(root, "files"));
    for (const path of paths) await cp(join(source, path), join(root, "files", path));
    const bundled = await build({
      stdin: {
        contents: `import { createSourceEditor } from "./examples/academy/workspace/create-source-editor.js";
import { createFileProvider } from "./browser/academy-editor/create-file-provider.js";
const project = createFileProvider();
createSourceEditor(document.querySelector('main'), project, ${JSON.stringify(paths)});`,
        resolveDir: process.cwd(),
        sourcefile: "academy-editor-entry.js",
      },
      bundle: true,
      format: "esm",
      platform: "browser",
      write: false,
    });
    const css = await readFile("examples/academy/workspace/source-editor.css", "utf8");
    let origin;
    server = createServer((request, response) => {
      response.setHeader("Cache-Control", "no-store");
      response.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      );
      const url = new URL(request.url ?? "/", "http://localhost");
      let path;
      try {
        path = decodeURIComponent(url.pathname.slice("/files/".length));
      } catch {
        response.writeHead(400).end();
        return;
      }
      const send = (status, type, body) => {
        response.writeHead(status, { "Content-Type": type });
        response.end(body);
      };
      if (url.pathname.startsWith("/files/") && paths.includes(path)) {
        const file = join(root, "files", path);
        if (request.method === "GET") return send(200, "text/plain", readFileSync(file, "utf8"));
        if (request.method !== "PUT") return send(405, "text/plain", "method refused");
        if (request.headers.origin !== origin) return send(403, "text/plain", "origin refused");
        void readSaveBody(request)
          .then(({ before, after }) => {
            if (readFileSync(file, "utf8") !== before)
              return send(409, "text/plain", "project changed; outside edit kept");
            writeFileSync(file, after);
            send(200, "text/plain", "saved");
          })
          .catch(() => send(400, "text/plain", "save refused"));
        return;
      }
      if (request.method !== "GET") return send(405, "text/plain", "method refused");
      if (url.pathname === "/editor.js")
        return send(200, "text/javascript", bundled.outputFiles[0].text);
      if (url.pathname === "/editor.css") return send(200, "text/css", css);
      if (url.pathname !== "/") return send(404, "text/plain", "not found");
      send(
        200,
        "text/html",
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Academy source editor proof</title><link rel="stylesheet" href="/editor.css"><main><h1>Academy source editor</h1><p>Editor proof only. Runtime and preview acceptance remain open.</p></main><script type="module" src="/editor.js"></script></html>',
      );
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    return {
      origin,
      readFile(path) {
        if (!paths.includes(path)) throw new Error("unknown file");
        return readFileSync(join(root, "files", path), "utf8");
      },
      editFile(path, text) {
        if (!paths.includes(path)) throw new Error("unknown file");
        writeFileSync(join(root, "files", path), text);
      },
      async close() {
        try {
          await new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
        } finally {
          await rm(root, { recursive: true });
        }
      },
    };
  } catch (error) {
    try {
      if (server?.listening) await new Promise((resolve) => server.close(resolve));
    } finally {
      await rm(root, { recursive: true });
    }
    throw error;
  }
}
