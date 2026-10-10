// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defineAssembly, localFetch, registerAssemblies } from "@assemblejs/core";
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
// A parent: its view places hello, as a page would.
const shell = defineAssembly({
  name: "shell",
  views: {
    default: {
      renderer: "html",
      markup: () => '<section><assembly name="hello"></assembly></section>',
    },
  },
});

const logged: LogLine[] = [];
const app = Fastify({ logger: false });
const get = (url: string, headers: Record<string, string> = {}) =>
  app.inject({ method: "GET", url, headers });
/** The id a failed envelope of this name carries, and what the log says against that id. */
const failure = (body: string, name: string): string | undefined => {
  const id = new RegExp(`data-name="${name}"[^>]* data-failed="([^"]+)"`).exec(body)?.[1];
  return logged.find((line) => line.correlationId === id)?.message;
};

beforeAll(async () => {
  const assemblies = new Map([
    ["hello", hello],
    ["broken", broken],
    ["shell", shell],
  ]);
  const limits = { depth: 3, maxBytes: 1024 * 1024 };
  const log = (line: LogLine): void => void logged.push(line);
  const local = localFetch(assemblies, log, limits);
  registerAssemblies(app, { assemblies, version: "v7", limits, local, log });
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

describe("an assembly whose view places a child, served", () => {
  it("answers the parent with the child composed inside it, each in its own envelope", async () => {
    const response = await get("/assembly/shell/?who=ada");
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatch(
      /^<assembly-root data-name="shell"[^>]*><section><assembly-root data-name="hello"[^>]*><p>Hello, ada<\/p>/,
    );
    expect(response.body).not.toContain("data-failed");
  });

  // What a composer on another server sends: the headers hold the cycle across the hop.
  it("refuses a child the arriving path already holds, inside a parent that still answers", async () => {
    const response = await get("/assembly/shell/", { "assembly-path": "hello/default" });
    expect(response.statusCode).toBe(200);
    expect(response.body).not.toContain("<p>Hello");
    expect(failure(response.body, "hello")).toBe(
      'assembly "hello" inside "shell" was answered by the fallback after cycle',
    );
  });

  it("refuses every child of a request that arrived at the cap, as its own composer would", async () => {
    const atCap = await get("/assembly/shell/", { "assembly-depth": "3" });
    expect(atCap.statusCode).toBe(200);
    expect(failure(atCap.body, "hello")).toBe(
      'assembly "hello" inside "shell" was answered by the fallback after depth',
    );
    // One level short of it, the child is one deeper and still inside the cap.
    const below = await get("/assembly/shell/", { "assembly-depth": "2" });
    expect(below.body).toContain("<p>Hello, world</p>");
  });
});
