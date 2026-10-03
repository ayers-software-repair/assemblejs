// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerFailures } from "@assemblejs/core";
import type { LogLine } from "@assemblejs/core";

const logged: LogLine[] = [];
const app = Fastify({ logger: false });
const failure = { error: { correlationId: expect.any(String) } };

beforeAll(async () => {
  registerFailures(app, (line) => logged.push(line));
  app.get("/throws", () => {
    throw new Error("connection to postgres://user:hunter2@db refused");
  });
  app.post("/items", (request) => ({ body: request.body ?? null }));
  app.get("/:anything", () => ({ shadowed: true }));
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe("what the server answers when it will not serve", () => {
  it("tells the caller an id for a throw, and logs the cause against that id", async () => {
    const response = await app.inject({ method: "GET", url: "/throws" });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain("hunter2");
    expect(response.json()).toEqual(failure);
    const { correlationId } = (response.json() as { error: { correlationId: string } }).error;
    expect(logged.find((line) => line.correlationId === correlationId)?.message).toContain(
      "hunter2",
    );
  });

  it("keeps a caller's own mistake a 4xx rather than reporting it as the server's", async () => {
    const post = (type: string, payload: string) =>
      app.inject({ method: "POST", url: "/items", headers: { "content-type": type }, payload });
    expect((await post("application/x-www-form-urlencoded", "a=1")).statusCode).toBe(415);
    const malformed = await post("application/json", "{bad");
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json()).toEqual(failure);
  });

  it("answers an unknown route with the failure body, not the router's description", async () => {
    const response = await app.inject({ method: "GET", url: "/no/such/route" });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(failure);
  });

  it("cannot let a route starting with a parameter answer under a reserved prefix", async () => {
    for (const url of ["/assembly", "/assembly/", "/_assemblejs", "/_assemblejs/nope"]) {
      const response = await app.inject({ method: "GET", url });
      expect(response.statusCode).toBe(404);
      expect(response.body).not.toContain("shadowed");
    }
    expect((await app.inject({ method: "GET", url: "/elsewhere" })).json()).toEqual({
      shadowed: true,
    });
  });
});
