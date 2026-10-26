// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NotFound, defineAssembly, localFetch, registerAssemblies } from "@asmjs/core";
import type { LogLine } from "@asmjs/core";
import { askedAndLeft, grand, slowkid } from "../fixtures/slow-child.js";

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
// One byte more than this server lets an answer be.
const heavy = defineAssembly({
  name: "heavy",
  views: { default: { renderer: "html", markup: () => "x".repeat(1024 * 1024 + 1) } },
});
// A parent: its view places hello, as a page would.
const shell = defineAssembly({
  name: "shell",
  views: {
    default: {
      renderer: "html",
      markup: () => '<section><assembly name="hello"></assembly></section>',
    },
    // A view's name is whatever a directive wrote, and every object answers to this one.
    odd: {
      renderer: "html",
      markup: () => '<assembly name="hello" view="constructor"></assembly>',
    },
  },
});

// Says not found, and a parent that places it.
const gone = defineAssembly({
  name: "gone",
  views: {
    default: {
      renderer: "html",
      data: () => {
        throw new NotFound("no such thing");
      },
      markup: () => "",
    },
  },
});
const holder = defineAssembly({
  name: "holder",
  views: { default: { renderer: "html", markup: () => '<assembly name="gone"></assembly>' } },
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
    ["heavy", heavy],
    ["shell", shell],
    ["grand", grand],
    ["slowkid", slowkid],
    ["gone", gone],
    ["holder", holder],
  ]);
  const limits = { depth: 3, maxBytes: 1024 * 1024, placements: 64 };
  const log = (line: LogLine): void => void logged.push(line);
  const local = localFetch(assemblies, log, limits);
  // A visitor who says so is a guest, and a guest may not be shown hello.
  const admit = (sent: Readonly<Record<string, string | undefined>>) =>
    sent["x-guest"] === undefined ? undefined : (name: string) => ({ admitted: name !== "hello" });
  registerAssemblies(app, { assemblies, version: "v7", limits, local, log, admit });
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

  // A view is one the assembly wrote. Read through the object, each of these found something:
  // a logged 500, an empty 200 and a manifest for a view that is not there.
  it("answers 404 for a view named after what every object has, at each endpoint", async () => {
    for (const view of ["constructor", "toString", "valueOf", "hasOwnProperty", "__proto__"]) {
      for (const endpoint of ["", "api/", "manifest/"]) {
        const url = `/assembly/hello/${view}/${endpoint}`;
        const response = await get(url);
        expect(response.statusCode, url).toBe(404);
        expect(response.json(), url).toEqual({ error: { correlationId: expect.any(String) } });
      }
    }
    expect(logged.filter((line) => line.message.includes("is not a function"))).toEqual([]);
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

  // What a page placing it would refuse, its own address refuses: an answer is under the
  // limit on bytes or it is a failure, whoever asked.
  it("answers an answer past the limit on bytes as its fallback under 500, and sends none of it", async () => {
    const response = await get("/assembly/heavy/");
    expect(response.statusCode).toBe(500);
    expect(response.body.length).toBeLessThan(1024);
    expect(failure(response.body, "heavy")).toContain(
      'assembly "heavy" answered more than 1048576 bytes',
    );
    // One byte fewer is an answer.
    expect((await get("/assembly/hello/")).statusCode).toBe(200);
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
  it("asks, for what its view places, whether the visitor who asked may be shown it", async () => {
    const guest = await get("/assembly/shell/", { "x-guest": "yes" });
    expect(guest.statusCode).toBe(200);
    expect(guest.body).toMatch(/<assembly-root data-name="hello"[^>]* data-failed="">/);
    expect(guest.body).not.toContain("Hello, world");
    // Nobody is let in for being asked about: a refusal is not a failure, and is not logged.
    expect(logged.filter((line) => line.message.includes('"hello" inside "shell"'))).toEqual([]);
    expect((await get("/assembly/shell/")).body).toContain("Hello, world");
  });

  it("answers a child placed by a view name every object has as a view that is not there", async () => {
    const response = await get("/assembly/shell/odd/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatch(/<assembly-root data-name="hello"[^>]* data-failed="[^"]+">/);
    expect(failure(response.body, "hello")).toBe(
      'assembly "hello" inside "shell" was answered by the fallback after status',
    );
    expect(logged.filter((line) => line.message.includes("is not a function"))).toEqual([]);
  });

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

describe("an assembly that says not found", () => {
  it("answers 404 with the failure body at its content and its data, unlogged", async () => {
    logged.length = 0;
    for (const url of ["/assembly/gone/", "/assembly/gone/default/api/", "/assembly/holder/"]) {
      const response = await get(url);
      expect(response.statusCode, url).toBe(404);
      expect(response.json(), url).toEqual({ error: { correlationId: expect.any(String) } });
      expect(response.body, url).not.toContain("no such thing");
    }
    expect(logged).toEqual([]);
  });
});

describe("what nobody waits for", () => {
  it("composes a child's children for an asker who waits, and none for one who left", async () => {
    const origin = await app.listen({ port: 0, host: "127.0.0.1" });
    await askedAndLeft(
      origin,
      "/assembly/slowkid/",
      logged,
      '1 placements inside "slowkid" were refused after aborted',
    );
  });
});
