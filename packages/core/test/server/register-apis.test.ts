// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defineApi, registerApis, reply } from "@assemblejs/core";
import type { ApiContext } from "@assemblejs/core";

const seen: ApiContext[] = [];
const app = Fastify({ logger: false });

beforeAll(async () => {
  registerApis(app, [
    defineApi({ path: "/api/time", handle: () => ({ now: "2026-10-03T00:00:00.000Z" }) }),
    defineApi({
      path: "/api/items/:id",
      handle: (context) => {
        seen.push(context);
        return { id: context.params["id"] ?? null, page: context.query.get("page") };
      },
    }),
    defineApi({
      path: "/api/items",
      method: "POST",
      handle: (context) => ({ received: context.body ?? null }),
    }),
    defineApi({ path: "/api/word", handle: () => "ok" }),
    defineApi({ path: "/api/nothing", handle: () => null }),
    // Two shapes, neither declared: each leaves out the other's members.
    defineApi({
      path: "/api/either",
      handle: ({ query }) =>
        query.get("ok") === "1" ? { ok: true, id: "1" } : { ok: false, problems: [] },
    }),
    // A plain-JavaScript handler can return nothing whatever the type says.
    defineApi({ path: "/api/void", handle: (() => undefined) as unknown as () => null }),
  ]);
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe("an api, mounted", () => {
  it("answers its route with JSON", async () => {
    const response = await app.inject({ method: "GET", url: "/api/time" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(response.json()).toEqual({ now: "2026-10-03T00:00:00.000Z" });
  });

  it("is handed its own params and query, and no body on a GET", async () => {
    const response = await app.inject({ method: "GET", url: "/api/items/42?page=3" });
    expect(response.json()).toEqual({ id: "42", page: "3" });
    const context = seen.at(-1);
    expect(context?.body).toBeUndefined();
    expect(Object.keys(context ?? {}).sort()).toEqual([
      "body",
      "cookies",
      "headers",
      "params",
      "query",
    ]);
  });

  it("takes a POST with a JSON body", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/items",
      payload: { name: "lamp" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ received: { name: "lamp" } });
  });

  it("answers only the method it declared", async () => {
    expect((await app.inject({ method: "POST", url: "/api/time" })).statusCode).toBe(404);
    expect((await app.inject({ method: "GET", url: "/api/items" })).statusCode).toBe(404);
  });

  it("sends a bare string and a null as JSON, the types the handler declared", async () => {
    const word = await app.inject({ method: "GET", url: "/api/word" });
    expect(word.body).toBe('"ok"');
    expect(word.headers["content-type"]).toContain("application/json");
    const nothing = await app.inject({ method: "GET", url: "/api/nothing" });
    expect(nothing.body).toBe("null");
    const absent = await app.inject({ method: "GET", url: "/api/void" });
    expect(absent.body).toBe("null");
  });

  it("answers whichever of two shapes the handler chose, without the other's members", async () => {
    const found = await app.inject({ method: "GET", url: "/api/either?ok=1" });
    expect(found.body).toBe('{"ok":true,"id":"1"}');
    const refused = await app.inject({ method: "GET", url: "/api/either" });
    expect(refused.body).toBe('{"ok":false,"problems":[]}');
  });
});

// R-16, the owner's "Apis learn who is asking, pages do not" (2026-10-12): an api reads the
// request's cookies and headers and may answer with a status, a cookie or a redirect.
describe("an api that learns who is asking", () => {
  const asked = Fastify({ logger: false });
  beforeAll(async () => {
    registerApis(asked, [
      defineApi({
        path: "/api/who",
        handle: ({ headers, cookies }) => ({
          lang: headers["accept-language"] ?? null,
          session: cookies["session"] ?? null,
          keys: Object.keys(cookies).sort(),
        }),
      }),
      defineApi({
        path: "/api/login",
        method: "POST",
        handle: () =>
          reply({
            status: 201,
            cookies: { session: { value: "s1", httpOnly: true, path: "/", sameSite: "lax" } },
            body: { ok: true },
          }),
      }),
      defineApi({ path: "/api/go", method: "POST", handle: () => reply.redirect("/thanks") }),
      defineApi({ path: "/api/quiet", handle: () => reply({ status: 204 }) }),
      defineApi({
        path: "/api/two",
        handle: () => reply({ cookies: { a: { value: "1" }, b: { value: "x y", maxAge: 60 } } }),
      }),
    ]);
    await asked.ready();
  });
  afterAll(async () => {
    await asked.close();
  });

  it("is handed the request's headers, lower-cased, and its cookies, parsed", async () => {
    const response = await asked.inject({
      method: "GET",
      url: "/api/who",
      headers: { "Accept-Language": "fr", cookie: "a=1; session=abc%20d" },
    });
    expect(response.json()).toEqual({ lang: "fr", session: "abc d", keys: ["a", "session"] });
  });

  it("answers a status, a cookie and a body when it says so", async () => {
    const response = await asked.inject({ method: "POST", url: "/api/login", payload: {} });
    expect(response.statusCode).toBe(201);
    expect(response.headers["set-cookie"]).toBe("session=s1; Path=/; HttpOnly; SameSite=Lax");
    expect(response.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(response.json()).toEqual({ ok: true });
  });

  it("redirects, so a form that posted lands on a page", async () => {
    const response = await asked.inject({ method: "POST", url: "/api/go", payload: {} });
    expect(response.statusCode).toBe(303);
    expect(response.headers["location"]).toBe("/thanks");
    expect(response.body).toBe("");
  });

  it("sends several cookies as several set-cookie headers", async () => {
    const response = await asked.inject({ method: "GET", url: "/api/two" });
    expect(response.headers["set-cookie"]).toEqual(["a=1", "b=x%20y; Max-Age=60"]);
  });

  it("answers no body at all when the reply has none", async () => {
    const response = await asked.inject({ method: "GET", url: "/api/quiet" });
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect(response.headers["content-type"]).toBeUndefined();
  });
});
