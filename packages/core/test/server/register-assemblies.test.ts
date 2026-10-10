// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defineAssembly, registerAssemblies } from "@assemblejs/core";
import type { LogLine } from "@assemblejs/core";

const hello = defineAssembly({
  name: "hello",
  views: {
    default: {
      renderer: "html",
      data: ({ query }) => ({ who: query.get("who") ?? "world" }),
      markup: ({ data }) => `<p>Hello, ${String(data["who"])}</p>`,
    },
    wide: { renderer: "html", markup: () => "<p>wide</p>" },
  },
  assets: { css: ["/hello.css"], js: [] },
});
const broken = defineAssembly({
  name: "broken",
  views: {
    default: {
      renderer: "html",
      markup: () => {
        throw new Error("hunter2");
      },
    },
  },
});

const logged: LogLine[] = [];
const app = Fastify({ logger: false });
const get = (url: string, headers: Record<string, string> = {}) =>
  app.inject({ method: "GET", url, headers });

beforeAll(async () => {
  registerAssemblies(app, {
    assemblies: new Map([
      ["hello", hello],
      ["broken", broken],
    ]),
    version: "v7",
    maxDepth: 3,
    log: (line) => logged.push(line),
  });
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe("the assembly contract, mounted", () => {
  it("answers an assembly's content in its envelope, at the bare name and at a named view", async () => {
    const bare = await get("/assembly/hello/?who=ada");
    expect(bare.statusCode).toBe(200);
    expect(bare.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(bare.headers["assembly-name"]).toBe("hello");
    expect(bare.headers["assembly-version"]).toBe("v7");
    expect(bare.body).toContain('<assembly-root data-name="hello"');
    expect(bare.body).toContain("<p>Hello, ada</p>");
    expect((await get("/assembly/hello/wide/")).body).toContain("<p>wide</p>");
  });

  it("answers the data alone, and the manifest, beside the content", async () => {
    expect((await get("/assembly/hello/default/api/?who=ada")).json()).toEqual({ who: "ada" });
    const manifest = (await get("/assembly/hello/default/manifest/")).json<{
      name: string;
      version: string;
    }>();
    expect([manifest.name, manifest.version]).toEqual(["hello", "v7"]);
  });

  it("answers 404 with an id for an assembly or a view this server does not have", async () => {
    for (const url of ["/assembly/nope/", "/assembly/hello/tall/", "/assembly/nope/x/api/"]) {
      const response = await get(url);
      expect(response.statusCode, url).toBe(404);
      expect(response.json(), url).toEqual({ error: { correlationId: expect.any(String) } });
    }
  });

  it("refuses composition headers it cannot read, above its cap, or holding a cycle", async () => {
    const refused = async (headers: Record<string, string>) =>
      (await get("/assembly/hello/", headers)).statusCode;
    expect(await refused({ "assembly-depth": "abc" })).toBe(400);
    expect(await refused({ "assembly-depth": "4" })).toBe(400);
    expect(await refused({ "assembly-path": "hello/default" })).toBe(400);
    // At the cap, and with another assembly on the path, it is served.
    expect(await refused({ "assembly-depth": "3", "assembly-path": "shell/default" })).toBe(200);
  });

  it("answers a render that threw as its fallback under 500, the cause in the log alone", async () => {
    const response = await get("/assembly/broken/");
    expect(response.statusCode).toBe(500);
    const id = /data-failed="([^"]+)"/.exec(response.body)?.[1];
    expect(response.body).not.toContain("hunter2");
    expect(logged.find((line) => line.correlationId === id)?.message).toContain("hunter2");
  });
});
