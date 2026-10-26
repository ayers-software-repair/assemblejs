// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_LIMITS,
  NotFound,
  createMemoryCache,
  createRemoteTransport,
  defineAssembly,
  localFetch,
  pageAnswer,
} from "@asmjs/core";
import type { PageServing } from "@asmjs/core";

const echo = defineAssembly({
  name: "echo",
  views: {
    default: {
      renderer: "html",
      data: ({ query }) => {
        if (query.get("say") === "nothing") throw new NotFound();
        return { said: query.get("say") ?? "" };
      },
      markup: ({ data }) => `<p>${String(data["said"])}</p>`,
    },
  },
});
const assemblies = new Map([["echo", echo]]);
const silent = (): undefined => undefined;
const serving: PageServing = {
  assemblies,
  local: localFetch(assemblies, silent, DEFAULT_LIMITS),
  limits: DEFAULT_LIMITS,
  remote: createRemoteTransport({ remotes: [], maxBytes: DEFAULT_LIMITS.maxBytes, log: silent }),
  remotes: [],
  cache: createMemoryCache(),
  log: silent,
};
const answer = pageAnswer(
  { template: '<body><assembly name="echo"></assembly></body>' },
  "/echo",
  serving,
);
const app = Fastify({ logger: false });
const thrown: unknown[] = [];

beforeAll(async () => {
  app.get<{ Querystring: { say?: string } }>("/echo", async (request, reply) => {
    const query = new URLSearchParams(
      request.query.say === undefined ? "" : { say: request.query.say },
    );
    try {
      return await answer(request, reply, { status: 410, params: {}, query });
    } catch (error) {
      thrown.push(error);
      return reply.code(299).send("caught");
    }
  });
  await app.ready();
});
afterAll(async () => {
  await app.close();
});

describe("answering one page", () => {
  it("sends the composed document under the status it is asked for, with the query it is given", async () => {
    const response = await app.inject({ method: "GET", url: "/echo?say=hello" });
    expect(response.statusCode).toBe(410);
    expect(response.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(response.body).toContain("<p>hello</p>");
  });

  it("throws a not-found on before it sends anything, for its caller to answer", async () => {
    const response = await app.inject({ method: "GET", url: "/echo?say=nothing" });
    expect(response.statusCode).toBe(299);
    expect(thrown.at(-1)).toBeInstanceOf(NotFound);
  });
});
