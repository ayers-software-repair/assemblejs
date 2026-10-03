// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, defineApi, defineAssembly } from "@assemblejs/core";
import type { App } from "@assemblejs/core";

const config = (auth?: { user: string; password: string }) => ({
  mode: "production" as const,
  host: "127.0.0.1",
  port: 0,
  auth,
});
const hello = defineAssembly({
  name: "hello",
  views: { default: { renderer: "html", markup: () => "<p>hi</p>" } },
});
const credentials = `Basic ${Buffer.from("ada:pw").toString("base64")}`;

let app: App;
beforeAll(async () => {
  app = await createServer({
    config: config({ user: "ada", password: "pw" }),
    log: () => undefined,
    assemblies: [hello],
    apis: [defineApi({ path: "/api/open", handle: () => ({ open: true }) })],
    pages: [{ route: "/", template: '<body><assembly name="hello"></assembly></body>' }],
    publicRoutes: ["/api/open"],
    remotes: [{ origin: "https://checkout.example.com" }],
  });
});
afterAll(async () => {
  await app.close();
});

describe("the one access decision, in front of everything", () => {
  // B-14's proof.
  it("answers 401 without credentials and 200 with them, on every kind of route", async () => {
    for (const url of [
      "/",
      "/assembly/hello/",
      "/assembly/hello/default/api/",
      "/assembly/hello/default/manifest/",
    ]) {
      const refused = await app.inject({ method: "GET", url });
      expect(refused.statusCode).toBe(401);
      expect(refused.headers["www-authenticate"]).toContain("Basic");
      expect(refused.body).not.toContain("<p>hi</p>");
      const allowed = await app.inject({
        method: "GET",
        url,
        headers: { authorization: credentials },
      });
      expect(allowed.statusCode).toBe(200);
    }
  });

  it("refuses before a route is even matched, so an unknown path is 401 too", async () => {
    expect((await app.inject({ method: "GET", url: "/no/such/thing" })).statusCode).toBe(401);
  });

  it("lets the declared public routes and the health check through", async () => {
    expect((await app.inject({ method: "GET", url: "/api/open" })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/_assemblejs/health" })).statusCode).toBe(200);
  });

  it("puts the default policy, with the declared remotes, on every html answer", async () => {
    const page = await app.inject({
      method: "GET",
      url: "/",
      headers: { authorization: credentials },
    });
    expect(page.headers["content-security-policy"]).toContain("https://checkout.example.com");
    expect(page.headers["x-content-type-options"]).toBe("nosniff");
    const api = await app.inject({ method: "GET", url: "/api/open" });
    expect(api.headers["content-security-policy"]).toBeUndefined();
    // Same origin by default: nothing grants another origin's page access to the data.
    expect(api.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("is decided in exactly one place in the whole server", () => {
    const src = fileURLToPath(new URL("../../src/", import.meta.url));
    const files: string[] = [];
    const walk = (at: string): void => {
      for (const entry of readdirSync(at, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(join(at, entry.name));
        else files.push(join(at, entry.name));
      }
    };
    walk(src);
    const deciding = files.filter((file) =>
      /code\(401\)|decideAccess\(|matchesBasic\(/.test(readFileSync(file, "utf8")),
    );
    expect(deciding.map((file) => file.slice(src.length)).sort()).toEqual([
      "access/decide-access.ts",
      "access/matches-basic.ts",
      "access/register-access.ts",
    ]);
  });
});

describe("refusing to be built with two deciders", () => {
  it("refuses basic credentials and an authenticate check together", async () => {
    await expect(
      createServer({
        config: config({ user: "a", password: "b" }),
        assemblies: [],
        authenticate: () => true,
      }),
    ).rejects.toThrow(/one place decides/);
  });

  it("answers the product's check, with no basic challenge", async () => {
    const custom = await createServer({
      config: config(),
      log: () => undefined,
      assemblies: [hello],
      authenticate: (request) => request.headers["x-team"] === "shop",
    });
    const refused = await custom.inject({ method: "GET", url: "/assembly/hello/" });
    expect(refused.statusCode).toBe(401);
    expect(refused.headers["www-authenticate"]).toBeUndefined();
    expect(
      (
        await custom.inject({
          method: "GET",
          url: "/assembly/hello/",
          headers: { "x-team": "shop" },
        })
      ).statusCode,
    ).toBe(200);
    await custom.close();
  });
});
