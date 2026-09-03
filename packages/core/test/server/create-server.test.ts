// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BootError, createServer, defineAssembly } from "@assemblejs/core";
import type { App, Config } from "@assemblejs/core";

const config: Config = { mode: "production", host: "127.0.0.1", port: 0, auth: undefined };

let dataCalls = 0;
const hello = defineAssembly({
  name: "hello",
  views: {
    default: {
      renderer: "html",
      data: ({ query }) => {
        dataCalls += 1;
        return { greeting: `Hello, ${query.get("name") ?? "world"}` };
      },
      markup: ({ data }) => `<p>${String(data["greeting"])}</p>`,
    },
    compact: { renderer: "html", data: () => ({ greeting: "Hi" }), markup: () => "<p>Hi</p>" },
  },
});

const exploding = defineAssembly({
  name: "exploding",
  views: {
    default: {
      renderer: "html",
      data: () => {
        throw new Error("connection to postgres://user:hunter2@db refused");
      },
      markup: () => "",
    },
  },
});

let app: App;
beforeAll(async () => {
  app = await createServer({ config, assemblies: [hello, exploding], version: "9f2c1a" });
});
afterAll(async () => {
  await app.close();
});

describe("the content endpoint", () => {
  it("answers a fragment wrapped in the envelope", async () => {
    const response = await app.inject({ method: "GET", url: "/assembly/hello/" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain("<assembly-root");
    expect(response.body).toContain("<p>Hello, world</p>");
    // A fragment, never a document.
    expect(response.body).not.toContain("<html");
    expect(response.body).not.toContain("<body");
  });

  it("echoes the assembly it served and the version of its output", async () => {
    const response = await app.inject({ method: "GET", url: "/assembly/hello/" });
    expect(response.headers["assembly-name"]).toBe("hello");
    expect(response.headers["assembly-version"]).toBe("9f2c1a");
  });

  it("serves a named view", async () => {
    const response = await app.inject({ method: "GET", url: "/assembly/hello/compact/" });
    expect(response.body).toContain("<p>Hi</p>");
    expect(response.body).toContain(`data-view="compact"`);
  });

  it("stamps the id the parent allocated", async () => {
    const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    const response = await app.inject({
      method: "GET",
      url: "/assembly/hello/",
      headers: { "assembly-id": id },
    });
    expect(response.body).toContain(`data-id="${id}"`);
  });

  it("is 404 for an assembly or a view that does not exist", async () => {
    expect((await app.inject({ method: "GET", url: "/assembly/nope/" })).statusCode).toBe(404);
    expect((await app.inject({ method: "GET", url: "/assembly/hello/nope/" })).statusCode).toBe(
      404,
    );
  });
});

describe("the data endpoint", () => {
  it("answers exactly the object the island carries", async () => {
    const content = await app.inject({ method: "GET", url: "/assembly/hello/default/?name=ada" });
    const data = await app.inject({ method: "GET", url: "/assembly/hello/default/api/?name=ada" });

    expect(data.statusCode).toBe(200);
    expect(data.json()).toEqual({ greeting: "Hello, ada" });

    // The same object, from the same function, reached two ways.
    const island = content.body.slice(
      content.body.indexOf(">{", content.body.indexOf("<script")) + 1,
      content.body.indexOf("</script>"),
    );
    expect(JSON.parse(island).data).toEqual(data.json());
  });

  it("comes from the one function the content endpoint also calls", async () => {
    const before = dataCalls;
    await app.inject({ method: "GET", url: "/assembly/hello/default/api/" });
    await app.inject({ method: "GET", url: "/assembly/hello/" });
    // Two requests, two calls: one function, not two code paths that could drift.
    expect(dataCalls).toBe(before + 2);
  });
});

describe("the manifest endpoint", () => {
  it("answers the handshake", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/assembly/hello/default/manifest/",
    });
    expect(response.json()).toEqual({
      contract: 1,
      name: "hello",
      view: "default",
      version: "9f2c1a",
      views: ["default", "compact"],
      renderer: "html",
      assets: { css: [], js: [] },
      public: true,
    });
  });
});

describe("the composition headers", () => {
  it("are accepted from anyone, because there is no privileged variant of the route", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/assembly/hello/",
      headers: {
        "assembly-page": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
        "assembly-depth": "2",
        "assembly-path": "page/default,outer/default",
      },
    });
    expect(response.statusCode).toBe(200);
  });

  it("are refused when malformed, rather than coerced", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/assembly/hello/",
      headers: { "assembly-depth": "not-a-number" },
    });
    expect(response.statusCode).toBe(400);
    expect(JSON.stringify(response.json())).toContain("assembly-depth");
  });

  it("are refused above the depth cap", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/assembly/hello/",
      headers: { "assembly-depth": "99" },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("the error contract", () => {
  it("tells the visitor an id and never what went wrong", async () => {
    const response = await app.inject({ method: "GET", url: "/assembly/exploding/" });
    expect(response.statusCode).toBe(500);
    const body = response.body;
    expect(body).toMatch(/[0-9a-f]{8}/);
    // Not the message, not the credential in it, not a stack frame.
    expect(body).not.toContain("postgres");
    expect(body).not.toContain("hunter2");
    expect(body).not.toContain("refused");
    expect(body).not.toContain("create-server");
    expect(response.json()).toEqual({ error: { correlationId: expect.any(String) } });
  });
});

describe("the framework's own surface", () => {
  it("answers health under the reserved prefix", async () => {
    const response = await app.inject({ method: "GET", url: "/_assemblejs/health" });
    expect(response.json()).toEqual({ status: "ok", version: "9f2c1a" });
  });
});

describe("refusing to be built", () => {
  // Everything that can refuse refuses before anything listens: a process accepting
  // connections is a process that is configured.
  it("throws before listen, not after", async () => {
    await expect(
      createServer({ config, assemblies: [{ name: "Bad Name", views: {} }] }),
    ).rejects.toThrow(BootError);
  });
});
