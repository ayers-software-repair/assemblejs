// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ASSET_ROUTE_PREFIX,
  OUTLINE_ATTRIBUTE,
  OUTLINE_ROUTE,
  OUTLINE_SOURCE,
  OUTLINE_STYLES,
  createServer,
  defineAssembly,
} from "@asmjs/core";
import type { OutlineAccount } from "@asmjs/core/outline";

const view = (markup: string | (() => string)) => ({
  default: { renderer: "html", markup: typeof markup === "string" ? () => markup : markup },
});
// A deferred placement is filled by the runtime, which a page carries for a browser half.
const assets = mkdtempSync(join(tmpdir(), "assets-"));
writeFileSync(join(assets, "shell.js"), "export {};");
const assemblies = [
  defineAssembly({ name: "badge", views: view("<b>badge</b>") }),
  defineAssembly({
    name: "shell",
    views: view('<header><assembly name="badge"></assembly></header>'),
    assets: { css: [], js: [`${ASSET_ROUTE_PREFIX}/shell.js`] },
  }),
  defineAssembly({ name: "kept", views: view("<p>kept</p>") }),
  defineAssembly({ name: "later", views: view("<p>later</p>") }),
  defineAssembly({
    name: "broken",
    views: view(() => {
      throw new Error("connection to postgres://user:hunter2@db refused");
    }),
  }),
];
const pages = [
  {
    route: "/",
    template:
      '<!doctype html><html><head><title>t</title></head><body><assembly name="shell"></assembly>' +
      '<assembly name="kept"></assembly><assembly name="kept"></assembly>' +
      '<assembly name="later"></assembly><assembly name="broken"></assembly></body></html>',
    place: {
      kept: { cache: { ttl: 60_000 } },
      later: { defer: true },
      broken: { fallback: "<p>unavailable</p>" },
    },
  },
];
const server = (outline?: boolean, auth?: { user: string; password: string }) =>
  createServer({
    config: { mode: "production", host: "127.0.0.1", port: 0, auth },
    assemblies,
    pages,
    assets,
    log: () => undefined,
    ...(auth === undefined ? {} : { publicRoutes: ["/"] }),
    ...(outline === undefined ? {} : { outline }),
  });
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const BLOCK = new RegExp(`<script type="application/json" ${OUTLINE_ATTRIBUTE}>(.*?)</script>`);
const page = async (app: Awaited<ReturnType<typeof server>>): Promise<string> =>
  (await app.inject({ method: "GET", url: "/" })).body;
const account = (sent: string): OutlineAccount =>
  JSON.parse(BLOCK.exec(sent)?.[1] ?? "") as OutlineAccount;

describe("a server that was not told to show its outline", () => {
  it("sends the pages it always sent, and serves nothing for an outline", async () => {
    const [absent, off] = [await server(), await server(false)];
    const plain = (sent: string): string =>
      sent.replace(UUID, "ID").replace(/data-failed="[^"]*"/, "");
    const sent = plain(await page(absent));
    expect(plain(await page(off))).toBe(sent);
    expect(sent).not.toContain("outline");
    for (const app of [absent, off]) {
      for (const path of Object.values(OUTLINE_ROUTE)) {
        expect((await app.inject({ method: "GET", url: path })).statusCode, path).toBe(404);
      }
      await app.close();
    }
  });
});

describe("a server told to show its outline", () => {
  it("serves the script, the module it starts and the stylesheet, each as what it is", async () => {
    const app = await server(true);
    const script = await app.inject({ method: "GET", url: OUTLINE_ROUTE.script });
    expect(script.body).toBe(OUTLINE_SOURCE);
    expect(script.headers["content-type"]).toBe("text/javascript; charset=utf-8");
    const module = await app.inject({ method: "GET", url: OUTLINE_ROUTE.module });
    expect(module.headers["content-type"]).toBe("text/javascript; charset=utf-8");
    expect(module.body).toMatch(/export \{[^}]*\boutline\b/);
    const sheet = await app.inject({ method: "GET", url: OUTLINE_ROUTE.stylesheet });
    expect(sheet.body).toBe(OUTLINE_STYLES);
    expect(sheet.headers["content-type"]).toBe("text/css; charset=utf-8");
    for (const answer of [script, module, sheet]) {
      expect(answer.headers["x-content-type-options"]).toBe("nosniff");
      expect(answer.headers["cache-control"]).toBe("no-cache");
    }
    await app.close();
  });

  it("answers that a file is still the file to a browser that holds it, by its content", async () => {
    const app = await server(true);
    for (const url of Object.values(OUTLINE_ROUTE)) {
      const first = await app.inject({ method: "GET", url });
      const tag = String(first.headers["etag"]);
      expect(tag, url).toMatch(/^"[\w-]{22}"$/);
      const again = await app.inject({ method: "GET", url, headers: { "if-none-match": tag } });
      expect([again.statusCode, again.body], url).toEqual([304, ""]);
      expect(again.headers["etag"], url).toBe(tag);
      const other = await app.inject({ method: "GET", url, headers: { "if-none-match": '"x"' } });
      expect([other.statusCode, other.body], url).toEqual([200, first.body]);
    }
    await app.close();
  });

  it("links the script and tells it of each placement by the id on its envelope", async () => {
    const app = await server(true);
    await page(app);
    const sent = await page(app);
    expect(sent).toContain(`<script type="module" src="${OUTLINE_ROUTE.script}"></script>`);
    // One block, after everything the page placed and outside all of it.
    expect(sent.match(new RegExp(OUTLINE_ATTRIBUTE, "g"))).toHaveLength(1);
    expect(sent.indexOf(OUTLINE_ATTRIBUTE)).toBeGreaterThan(sent.lastIndexOf("</assembly-root>"));
    const told = account(sent);
    expect(told.route).toBe("/");
    expect(told.placements.map((row) => [row.name, row.source])).toEqual([
      ["shell", "local"],
      ["kept", "cache"],
      ["kept", "cache"],
      ["later", "deferred"],
      ["broken", "fallback"],
    ]);
    expect(told.placements[0]?.children?.map((row) => row.name)).toEqual(["badge"]);
    // Each row is its own envelope's, the two answered by one kept answer among them.
    const rows = [...told.placements, ...(told.placements[0]?.children ?? [])];
    expect(new Set(rows.map((row) => row.id)).size).toBe(6);
    for (const row of rows) {
      expect(sent, row.name).toContain(`data-name="${row.name}" data-id="${row.id}"`);
    }
    await app.close();
  });

  it("tells a visitor that a placement fell back, and never what it threw", async () => {
    const app = await server(true);
    const sent = await page(app);
    expect(sent).not.toContain("hunter2");
    expect(Object.keys(account(sent).placements.at(-1) ?? {}).sort()).toEqual(
      ["id", "ms", "name", "source", "view"].sort(),
    );
    await app.close();
  });

  it("writes none of it into what an assembly's own address answers", async () => {
    const app = await server(true);
    const answer = await app.inject({ method: "GET", url: "/assembly/shell/" });
    expect(answer.statusCode).toBe(200);
    expect(answer.body).not.toContain("outline");
    await app.close();
  });

  it("lets a public page of a guarded server load it, and guards the rest as before", async () => {
    const app = await server(true, { user: "ada", password: "pw" });
    expect((await app.inject({ method: "GET", url: "/" })).statusCode).toBe(200);
    for (const path of Object.values(OUTLINE_ROUTE)) {
      expect((await app.inject({ method: "GET", url: path })).statusCode, path).toBe(200);
    }
    expect((await app.inject({ method: "GET", url: "/assembly/shell/" })).statusCode).toBe(401);
    await app.close();
  });
});
