// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { afterAll, beforeAll } from "vitest";

const failed = (name: string, id: string): string =>
  `<assembly-root data-name="${name}" data-id="y" data-view="default" data-renderer="" data-failed="${id}"></assembly-root>`;

/**
 * The project's own dev server, as the agent surface finds it: a server answering its health and
 * the content endpoint for what only it renders, started for the specs of the file that asks,
 * and `runningFor`, which writes the record of it under a project's root.
 *
 * Every assembly is answered as a framework view the server rendered, but two. `failing` answers
 * its fallback envelope under a 500, marked with the id its failure is logged against,
 * `c0ffee12`; and `holder` stands with a child that fell back inside it, `price`, marked
 * `deadbeef`.
 */
export function devServer(): { readonly runningFor: (dir: string) => void } {
  const server = createServer((request, response) => {
    if (request.url === "/_assemblejs/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end('{"status":"ok","version":"v"}');
      return;
    }
    const name = /^\/assembly\/([a-z-]+)\//.exec(request.url ?? "")?.[1] ?? "none";
    response.writeHead(name === "failing" ? 500 : 200, {
      "content-type": "text/html; charset=utf-8",
    });
    const inside =
      name === "holder" ? failed("price", "deadbeef") : `<button>served ${name}</button>`;
    response.end(
      name === "failing"
        ? failed("failing", "c0ffee12")
        : `<assembly-root data-name="${name}" data-id="x" data-view="default" data-renderer="react">${inside}</assembly-root>`,
    );
  });
  let origin = "";
  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
  return {
    runningFor: (dir) => {
      mkdirSync(join(dir, ".assemblejs"), { recursive: true });
      writeFileSync(join(dir, ".assemblejs", "dev.json"), JSON.stringify({ url: origin }));
    },
  };
}
