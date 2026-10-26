// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerRelay } from "@asmjs/core";

const SHOP = "https://shop.example";
const relay = (origin: string, path: string) =>
  `/_assemblejs/remote/${encodeURIComponent(origin)}${path}`;

const calls: Array<{ url: string; method: string; headers: Record<string, string>; body: string }> =
  [];
const answer = { status: 200, type: "application/json; charset=utf-8", body: '{"stock":3}' };
const fetchImpl: typeof fetch = async (input, init) => {
  const headers = Object.fromEntries(new Headers(init?.headers).entries());
  calls.push({
    url: String(input),
    method: init?.method ?? "GET",
    headers,
    body: typeof init?.body === "string" ? init.body : "",
  });
  return new Response(answer.body, {
    status: answer.status,
    headers: { "content-type": answer.type, "set-cookie": "theirs=1", "x-them": "y" },
  });
};

const app = Fastify({ logger: false });
beforeAll(async () => {
  registerRelay(
    app,
    [{ origin: SHOP, forward: ["accept-language"] }, { origin: "https://plain.example" }],
    fetchImpl,
  );
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

// R-15, the owner's "The page's server relays the call" (2026-10-12): a remote assembly reaches
// its own server's apis through the page's server, which passes the call on; nothing for the
// other team to do, nothing crossing origins in the browser.
describe("the relay of a remote's api calls", () => {
  it("passes a GET to the declared origin, query and all, and the answer back as it came", async () => {
    const response = await app.inject({
      method: "GET",
      url: relay(SHOP, "/api/stock?sku=1&lang=fr"),
      headers: { "accept-language": "fr", cookie: "session=mine", authorization: "Bearer x" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(response.json()).toEqual({ stock: 3 });
    const call = calls.at(-1);
    expect(call?.url).toBe(`${SHOP}/api/stock?sku=1&lang=fr`);
    expect(call?.method).toBe("GET");
    // Only what the remote is declared to receive: never the visitor's cookie or credential.
    expect(call?.headers["accept-language"]).toBe("fr");
    expect(call?.headers["cookie"]).toBeUndefined();
    expect(call?.headers["authorization"]).toBeUndefined();
    // Nothing a remote sets reaches the visitor but the body and its type.
    expect(response.headers["set-cookie"]).toBeUndefined();
    expect(response.headers["x-them"]).toBeUndefined();
  });

  it("passes a POST and its JSON body on", async () => {
    const response = await app.inject({
      method: "POST",
      url: relay(SHOP, "/api/restock"),
      payload: { sku: "1", count: 2 },
    });
    expect(response.statusCode).toBe(200);
    const call = calls.at(-1);
    expect(call?.method).toBe("POST");
    expect(JSON.parse(call?.body ?? "")).toEqual({ sku: "1", count: 2 });
    expect(call?.headers["content-type"]).toMatch(/^application\/json/);
  });

  it("passes the remote's status through, a 404 and a 500 alike", async () => {
    for (const status of [404, 500]) {
      answer.status = status;
      const response = await app.inject({ method: "GET", url: relay(SHOP, "/api/nope") });
      expect(response.statusCode).toBe(status);
    }
    answer.status = 200;
  });

  it("answers 404 for an origin the project does not declare, calling nothing", async () => {
    const before = calls.length;
    const response = await app.inject({
      method: "GET",
      url: relay("https://elsewhere.example", "/api/stock"),
    });
    expect(response.statusCode).toBe(404);
    expect(calls.length).toBe(before);
  });

  it("relays apis and nothing else of a remote", async () => {
    const before = calls.length;
    for (const path of ["/assembly/cart/default/", "/", "/_assemblejs/outline/outline.js"]) {
      const response = await app.inject({ method: "GET", url: relay(SHOP, path) });
      expect(response.statusCode, path).toBe(404);
    }
    expect(calls.length).toBe(before);
  });
});

describe("the relay of a remote that misbehaves", () => {
  const logged: string[] = [];
  let next: () => Promise<Response> = async () => new Response("{}");
  const misbehaving = Fastify({ logger: false });
  beforeAll(async () => {
    registerRelay(misbehaving, [{ origin: SHOP }], async () => next(), {
      log: (line) => logged.push(line.message),
      maxBytes: 8,
    });
    await misbehaving.ready();
  });
  afterAll(async () => {
    await misbehaving.close();
  });
  const ask = () => misbehaving.inject({ method: "GET", url: relay(SHOP, "/api/x") });

  it("answers 502 with the failure body, logged, for a remote that cannot be reached", async () => {
    next = async () => {
      throw new TypeError("fetch failed");
    };
    const response = await ask();
    expect(response.statusCode).toBe(502);
    expect(response.json().error.correlationId).toBeTruthy();
    expect(logged.at(-1)).toContain("fetch failed");
  });

  it("answers 502 for an answer over the cap", async () => {
    next = async () => new Response("0123456789");
    expect((await ask()).statusCode).toBe(502);
  });

  it("passes a redirect through as its status alone, without where it points", async () => {
    next = async () =>
      new Response(null, { status: 302, headers: { location: "https://x.example" } });
    const response = await ask();
    expect(response.statusCode).toBe(302);
    expect(response.headers["location"]).toBeUndefined();
  });

  it("answers every relayed answer with nosniff, and keeps a data type as it came", async () => {
    next = async () => new Response("{}", { headers: { "content-type": "application/json" } });
    const response = await ask();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["content-type"]).toBe("application/json");
  });

  it("answers html and xhtml, with any parameters, as plain text with the body as it came", async () => {
    for (const type of [
      "text/html",
      "TEXT/HTML; charset=iso-8859-1",
      "application/xhtml+xml; charset=utf-8",
    ]) {
      next = async () => new Response("<i>x</i>", { headers: { "content-type": type } });
      const response = await ask();
      expect(response.headers["content-type"], type).toBe("text/plain; charset=utf-8");
      expect(response.headers["x-content-type-options"], type).toBe("nosniff");
      expect(response.body, type).toBe("<i>x</i>");
    }
  });

  it("passes the bytes of an answer through untouched", async () => {
    next = async () =>
      new Response(new Uint8Array([0, 255, 128]), {
        headers: { "content-type": "application/octet-stream" },
      });
    expect(Array.from((await ask()).rawPayload)).toEqual([0, 255, 128]);
  });
});
