// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { LogLine } from "@assemblejs/core";
import {
  DEFAULT_LIMITS,
  DEV_RELOAD_SCRIPT,
  DEV_RELOAD_STREAM,
  createMemoryCache,
  createRemoteTransport,
  createServer,
  defineAssembly,
  localFetch,
  registerPages,
} from "@assemblejs/core";

const hello = defineAssembly({
  name: "hello",
  views: { default: { renderer: "html", markup: () => "<p>hi</p>" } },
  assets: { css: ["/hello.css"], js: ["/client.js"] },
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
const card = defineAssembly({
  name: "card",
  shadow: true,
  views: { default: { renderer: "html", markup: () => "<p>card</p>" } },
  assets: { css: ["/card.css"], js: [] },
});
const slow = defineAssembly({
  name: "slow",
  views: { default: { renderer: "html", markup: () => new Promise<string>(() => undefined) } },
});
const byName = new Map([
  ["hello", hello],
  ["broken", broken],
  ["slow", slow],
  ["card", card],
]);
const logged: LogLine[] = [];
const silent = (): undefined => undefined;
const app = Fastify({ logger: false });

beforeAll(async () => {
  registerPages(app, {
    pages: [
      {
        route: "/",
        template:
          '<!doctype html><html><head></head><body><assembly name="hello"></assembly><assembly name="hello"></assembly></body></html>',
      },
      {
        route: "/soft",
        template: '<body><assembly name="broken"></assembly></body>',
        place: { broken: { fallback: "<p>unavailable</p>" } },
      },
      {
        route: "/hard",
        template: '<body><assembly name="broken"></assembly></body>',
        place: { broken: { required: true } },
      },
      {
        route: "/isolated",
        template: '<html><head></head><body><assembly name="card"></assembly></body></html>',
      },
      {
        route: "/streaming",
        template:
          '<html><head><title>t</title></head><body><assembly name="hello"></assembly></body></html>',
        stream: "/live?room=a&b",
      },
      {
        route: "/stalled",
        template: '<body><assembly name="slow"></assembly></body>',
        place: { slow: { required: true, deadline: 20 } },
      },
    ],
    assemblies: byName,
    local: localFetch(byName, silent, DEFAULT_LIMITS),
    limits: DEFAULT_LIMITS,
    remote: createRemoteTransport({ remotes: [], maxBytes: DEFAULT_LIMITS.maxBytes, log: silent }),
    remotes: [],
    cache: createMemoryCache(),
    log: (line) => logged.push(line),
  });
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe("a page, mounted", () => {
  it("answers the composed document, every placement in its envelope", async () => {
    const response = await app.inject({ method: "GET", url: "/" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(response.body.match(/<assembly-root/g)?.length).toBe(2);
    expect(response.body).not.toMatch(/<assembly /);
  });

  it("names the page's stream in its head, for its runtime to open", async () => {
    const html = (await app.inject({ method: "GET", url: "/streaming" })).body;
    expect(html).toContain(
      '<title>t</title><link rel="stylesheet" href="/hello.css"><meta name="assemblejs-stream" content="/live?room=a&amp;b"></head>',
    );
    // A page that names no stream carries no element for one.
    expect((await app.inject({ method: "GET", url: "/" })).body).not.toContain("assemblejs-stream");
  });

  it("links each placed assembly's browser files once", async () => {
    const response = await app.inject({ method: "GET", url: "/" });
    expect(response.body.match(/client\.js/g)?.length).toBe(1);
    expect(response.body).toContain('<link rel="stylesheet" href="/hello.css"></head>');
  });

  it("serves a failing placement's fallback and the rest of the page", async () => {
    const response = await app.inject({ method: "GET", url: "/soft" });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("<p>unavailable</p>");
    expect(response.body).not.toContain("hunter2");
  });

  it("answers 503 with an id, never the cause, when a required placement fails", async () => {
    const response = await app.inject({ method: "GET", url: "/hard" });
    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain("hunter2");
    expect(response.json()).toEqual({ error: { correlationId: expect.any(String) } });
  });

  it("links a shadow assembly's styles inside its shadow root, never in the page head", async () => {
    const response = await app.inject({ method: "GET", url: "/isolated" });
    expect(response.body).toContain("<head></head>");
    expect(response.body).toContain(
      '<p>card</p><link rel="stylesheet" href="/card.css"></template>',
    );
  });

  it("logs every placement that fell back, against the id its envelope carries", async () => {
    const response = await app.inject({ method: "GET", url: "/soft" });
    const id = /data-failed="([^"]+)"/.exec(response.body)?.[1];
    expect(id).toMatch(/.+/);
    expect(
      logged.some((line) => line.correlationId === id && line.message.includes("broken")),
    ).toBe(true);
  });

  it("gives a required placement that timed out a real id, and logs it", async () => {
    const response = await app.inject({ method: "GET", url: "/stalled" });
    expect(response.statusCode).toBe(503);
    const { correlationId } = (response.json() as { error: { correlationId: string } }).error;
    expect(correlationId).not.toBe("");
    expect(logged.some((line) => line.correlationId === correlationId)).toBe(true);
  });
});

describe("a page in development", () => {
  it("links and serves the script that reloads it after a restart, and only in development", async () => {
    for (const mode of ["development", "production"] as const) {
      const server = await createServer({
        config: { mode, host: "127.0.0.1", port: 0, auth: undefined },
        assemblies: [{ name: "hello", views: hello.views }],
        pages: [{ route: "/", template: '<body><assembly name="hello"></assembly></body>' }],
        log: () => undefined,
      });
      const page = (await server.inject({ method: "GET", url: "/" })).body;
      const script = (await server.inject({ method: "GET", url: DEV_RELOAD_SCRIPT })).statusCode;
      const stream = server.fastify.hasRoute({ method: "GET", url: DEV_RELOAD_STREAM });
      await server.close();
      const linked = page.includes(`src="${DEV_RELOAD_SCRIPT}?boot=`);
      expect([linked, script, stream], mode).toEqual(
        mode === "development" ? [true, 200, true] : [false, 404, false],
      );
    }
  });
});

describe("a page placing an assembly from another server", () => {
  // B-13's proof: two servers in one test.
  let producer: Awaited<ReturnType<typeof createServer>>;
  let producerOrigin = "";
  let consumer: Awaited<ReturnType<typeof createServer>>;
  let recorder: ReturnType<typeof createHttpServer>;
  let renders = 0;
  const heard: string[] = [];
  const config = { mode: "production" as const, host: "127.0.0.1", port: 0, auth: undefined };

  beforeAll(async () => {
    producer = await createServer({
      config,
      log: () => undefined,
      assemblies: [
        defineAssembly({
          name: "cart",
          views: {
            default: {
              renderer: "html",
              markup: () => {
                renders += 1;
                return `<p>cart ${String(renders)}</p>`;
              },
            },
          },
        }),
      ],
    });
    const behind = (await producer.listen()).url;
    // A recording proxy in front of the producer, so the test hears exactly what the consumer sent.
    recorder = createHttpServer((request, response) => {
      heard.push(JSON.stringify(request.headers));
      void fetch(`${behind}${request.url ?? "/"}`).then(async (answer) => {
        response.writeHead(answer.status, {
          "content-type": answer.headers.get("content-type") ?? "",
          "assembly-version": answer.headers.get("assembly-version") ?? "",
        });
        response.end(await answer.text());
      });
    });
    await new Promise<void>((resolve) => recorder.listen(0, "127.0.0.1", resolve));
    producerOrigin = `http://127.0.0.1:${String((recorder.address() as AddressInfo).port)}`;
    consumer = await createServer({
      config,
      log: () => undefined,
      assemblies: [],
      remotes: [{ origin: producerOrigin }],
      pages: [
        {
          route: "/",
          template: '<body><assembly name="cart"></assembly></body>',
          place: { cart: { url: `${producerOrigin}/assembly/cart/`, cache: { ttl: 60_000 } } },
        },
        {
          route: "/gone",
          template: '<body><assembly name="cart"></assembly></body>',
          place: {
            cart: { url: `${producerOrigin}/assembly/nope/`, fallback: "<p>no cart</p>" },
          },
        },
      ],
    });
  });
  afterAll(async () => {
    await consumer.close();
    await new Promise((resolve) => recorder.close(resolve));
    await producer.close();
  });

  it("renders it, marked with its origin, and the second request is a cache hit", async () => {
    const first = await consumer.inject({
      method: "GET",
      url: "/",
      headers: { cookie: "s=hunter2" },
    });
    expect(first.body).toContain("<p>cart 1</p>");
    expect(first.body).toContain(`data-remote="${producerOrigin}"`);
    const second = await consumer.inject({ method: "GET", url: "/" });
    expect(second.body).toContain("<p>cart 1</p>");
    expect(renders).toBe(1);
  });

  it("never forwards the visitor's cookie", () => {
    expect(heard.length).toBeGreaterThan(0);
    expect(heard.join()).not.toContain("hunter2");
  });

  it("falls back when the remote does not answer", async () => {
    const response = await consumer.inject({ method: "GET", url: "/gone" });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain("<p>no cart</p>");
  });

  it("refuses to boot a page placing from an origin nobody declared", async () => {
    await expect(
      createServer({
        config,
        assemblies: [],
        pages: [
          {
            route: "/",
            template: '<assembly name="cart"></assembly>',
            place: { cart: { url: `${producerOrigin}/assembly/cart/` } },
          },
        ],
      }),
    ).rejects.toThrow(/not a declared remote/);
  });
});
