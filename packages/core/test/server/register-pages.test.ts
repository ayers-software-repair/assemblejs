// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defineAssembly, localFetch, registerPages } from "@assemblejs/core";

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
const byName = new Map([
  ["hello", hello],
  ["broken", broken],
]);
const app = Fastify({ logger: false });

beforeAll(async () => {
  registerPages(
    app,
    [
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
    ],
    byName,
    localFetch(byName, () => undefined),
    () => undefined,
  );
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
});
