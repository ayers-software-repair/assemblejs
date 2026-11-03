// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** Serves the committed site with the CI checkout of its pinned shared kit. */
export async function serveLanding() {
  const site = fileURLToPath(new URL("../../site/", import.meta.url));
  const kit = fileURLToPath(new URL("../../_platform/sitekit/", import.meta.url));
  const types: Readonly<Record<string, string>> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ttf": "font/ttf",
  };
  const brand = JSON.parse(
    await readFile(new URL("../../site-source/pages.json", import.meta.url), "utf8"),
  ) as { mark: string };
  const requests: string[] = [];
  const server = createServer(async (request, response) => {
    if (request.method !== "GET") {
      response.writeHead(405).end();
      return;
    }
    try {
      requests.push(request.url ?? "/");
      const path = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      ).replace(/^\/assemblejs(?:\/next)?\//, "/");
      if (path === "/previous-logo.html") {
        const html = await readFile(resolve(site, "index.html"), "utf8");
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(html.replaceAll(brand.mark, "mark.svg"));
        return;
      }
      const root = resolve(path.startsWith("/kit/") ? kit : site);
      const suffix = path.startsWith("/kit/") ? path.slice(5) : path.slice(1);
      const file = resolve(root, suffix || "index.html");
      const type = types[extname(file)];
      if (!file.startsWith(root + sep) || type === undefined) {
        response.writeHead(404).end();
        return;
      }
      const contents = await readFile(file);
      response.writeHead(200, {
        "Content-Type": type,
        ...([".svg", ".png"].includes(extname(file))
          ? { "Cache-Control": "public, max-age=604800" }
          : {}),
      });
      response.end(contents);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((done, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", done);
  });
  const address = server.address();
  if (address === null || typeof address === "string")
    throw new Error("landing server has no port");
  return {
    origin: `http://127.0.0.1:${String(address.port)}`,
    requests,
    close: () =>
      new Promise<void>((done, reject) =>
        server.close((error) => (error ? reject(error) : done())),
      ),
  };
}
