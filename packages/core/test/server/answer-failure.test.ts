// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { answerFailure, createServer, defineAssembly } from "@assemblejs/core";
import type { LogLine } from "@assemblejs/core";

const failure = { error: { correlationId: expect.any(String) } };
const cart = defineAssembly({
  name: "cart",
  views: { default: { renderer: "html", markup: () => "<p>cart</p>" } },
});

describe("the one answer to a failure", () => {
  it("tells the caller an id, logs the cause against it, and lets no type be guessed", async () => {
    const logged: LogLine[] = [];
    const app = Fastify({ logger: false });
    app.setErrorHandler(answerFailure((line) => logged.push(line)));
    app.get("/throws", () => {
      throw new Error("connection to postgres://user:hunter2@db refused");
    });
    const response = await app.inject({ method: "GET", url: "/throws" });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(failure);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.body).not.toContain("hunter2");
    expect(logged[0]?.message).toContain("hunter2");
    await app.close();
  });
});

// The router refuses these before any route or hook sees them, and its own answer repeats the
// path it was sent.
describe("a url that is not one, asked of a server", () => {
  it("is answered 400 with the failure body, the path nowhere in it, and nothing logged", async () => {
    const logged: LogLine[] = [];
    const app = await createServer({
      config: { mode: "production", host: "127.0.0.1", port: 3000, auth: undefined },
      assemblies: [cart],
      log: (line) => logged.push(line),
    });
    for (const url of ["/assembly/cart/%zz/", "/%", "/shop/%e0%a4%a/"]) {
      const response = await app.inject({ method: "GET", url });
      expect(response.statusCode, url).toBe(400);
      expect(response.json(), url).toEqual(failure);
      expect(response.body, url).not.toContain("%");
      expect(response.headers["x-content-type-options"], url).toBe("nosniff");
    }
    expect(logged).toEqual([]);
    await app.close();
  });
});
