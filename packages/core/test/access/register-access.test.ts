// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, defineApi, defineAssembly, registerAccess } from "@assemblejs/core";
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

// A built browser file, so the asset route has something to serve.
const assets = mkdtempSync(join(tmpdir(), "access-assets-"));
mkdirSync(join(assets, "styles"));
writeFileSync(join(assets, "styles", "hello-1.css"), "p{}");

let app: App;
beforeAll(async () => {
  app = await createServer({
    assets,
    config: config({ user: "ada", password: "pw" }),
    log: () => undefined,
    assemblies: [hello],
    apis: [
      defineApi({ path: "/api/open", handle: () => ({ open: true }) }),
      defineApi({ path: "/api/closed", method: "POST", handle: () => ({ closed: true }) }),
    ],
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

  it("decides before the body is read, so a malformed body is still a 401", async () => {
    const refused = await app.inject({
      method: "POST",
      url: "/api/closed",
      headers: { "content-type": "application/json" },
      payload: "{ not json",
    });
    expect(refused.statusCode).toBe(401);
  });

  it("lets the declared public routes, the health check and the built browser files through", async () => {
    expect((await app.inject({ method: "GET", url: "/api/open" })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/_assemblejs/health" })).statusCode).toBe(200);
    // A page on another origin loads these with no credentials to hydrate this server's assemblies.
    expect(
      (await app.inject({ method: "GET", url: "/_assemblejs/assets/styles/hello-1.css" }))
        .statusCode,
    ).toBe(200);
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
      /(code|status)\(40[13]\)|decideAccess\(|matchesBasic\(/.test(readFileSync(file, "utf8")),
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

  it("admits only a check that answers true, never one that answers something truthy", async () => {
    const loose = await createServer({
      config: config(),
      log: () => undefined,
      assemblies: [hello],
      authenticate: () => "yes" as unknown as boolean,
    });
    expect((await loose.inject({ method: "GET", url: "/assembly/hello/" })).statusCode).toBe(401);
    await loose.close();
  });

  it("sends the project's own policy in place of the default, and refuses a blank one", async () => {
    const own = await createServer({
      config: config(),
      log: () => undefined,
      assemblies: [hello],
      pages: [{ route: "/", template: '<body><assembly name="hello"></assembly></body>' }],
      contentSecurityPolicy: "default-src 'none'",
    });
    expect((await own.inject({ method: "GET", url: "/" })).headers["content-security-policy"]).toBe(
      "default-src 'none'",
    );
    await own.close();
    await expect(
      createServer({ config: config(), assemblies: [], contentSecurityPolicy: " " }),
    ).rejects.toThrow(/policy is blank/);
  });
});

describe("the policy on an html answer", () => {
  it("is there whatever case the content type is written in", async () => {
    const bare = Fastify();
    registerAccess(
      bare,
      { basic: undefined, authenticate: undefined, publicRoutes: [] },
      "default-src 'self'",
    );
    bare.get("/shouting", async (_request, reply) =>
      reply.header("content-type", "Text/HTML").send("<p>a</p>"),
    );
    const answer = await bare.inject({ method: "GET", url: "/shouting" });
    expect(answer.headers["content-security-policy"]).toBe("default-src 'self'");
    await bare.close();
  });
});
