// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defineApi, registerApis } from "@assemblejs/core";
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
    expect(Object.keys(context ?? {}).sort()).toEqual(["body", "params", "query"]);
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
});
