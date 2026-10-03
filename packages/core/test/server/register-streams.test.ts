// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineApi, registerAccess, registerStreams } from "@assemblejs/core";
import type { ApiDefinition, LogLine, StreamContext } from "@assemblejs/core";

let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

/** Listens with the given streams, and answers its origin and the log it wrote. */
const serve = async (
  streams: readonly ApiDefinition[],
  heartbeat?: number,
  force: boolean | "idle" = true,
  before: (app: FastifyInstance) => void = () => undefined,
) => {
  const logged: LogLine[] = [];
  // Node's fetch can hold a spare connection that never sends a request, which a server that
  // closes only idle connections waits out; this stops the test's server, not the stream, at once.
  app = Fastify({ logger: false, forceCloseConnections: force });
  before(app);
  registerStreams(app, streams, (line) => logged.push(line), heartbeat);
  const origin = await app.listen({ port: 0, host: "127.0.0.1" });
  return { origin, logged };
};

/** Reads a response's body until it holds `until`, or it ends. */
const readUntil = async (response: Response, until: string): Promise<string> => {
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (!text.includes(until)) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
};

/** A promise and the function that settles it, for a stream to hand its context out by. */
const handOut = () => {
  let give: (context: StreamContext) => void = () => undefined;
  const given = new Promise<StreamContext>((resolve) => (give = resolve));
  return { given, give };
};

describe("a streaming api, mounted", () => {
  it("answers server-sent events, one line of JSON per message", async () => {
    const { origin } = await serve([
      defineApi({
        path: "/ticks",
        stream: (context) => {
          context.send("tick", { n: 1, text: "two\nlines" });
          context.send("tick", 2, { name: "cart" });
        },
      }),
    ]);
    const response = await fetch(`${origin}/ticks`);
    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");
    const text = await readUntil(response, "cart");
    expect(text).toContain('data: {"topic":"tick","payload":{"n":1,"text":"two\\nlines"}}\n\n');
    expect(text).toContain('data: {"topic":"tick","payload":2,"to":{"name":"cart"}}\n\n');
  });

  it("aborts the stream's signal when the page goes away, and sends nothing after", async () => {
    const { given, give } = handOut();
    const { origin } = await serve([defineApi({ path: "/live", stream: give })]);
    const controller = new AbortController();
    const response = await fetch(`${origin}/live`, { signal: controller.signal });
    await readUntil(response, ": open");
    const context = await given;
    controller.abort();
    await new Promise<void>((resolve) => context.signal.addEventListener("abort", () => resolve()));
    expect(() => context.send("late", 1)).not.toThrow();
  });

  it("logs a stream that throws against an id, and closes its connection", async () => {
    const { origin, logged } = await serve([
      defineApi({
        path: "/broken",
        stream: async () => {
          throw new Error("stream broke");
        },
      }),
    ]);
    const text = await readUntil(await fetch(`${origin}/broken`), "never written");
    expect(text).toBe(": open\n\n");
    expect(logged).toEqual([
      expect.objectContaining({ correlationId: expect.stringMatching(/^[0-9a-f]{8}$/) }),
    ]);
    expect(JSON.stringify(logged)).toContain("stream broke");
  });

  it("writes a comment while quiet, so an idle connection is not closed by a proxy", async () => {
    const { origin } = await serve([defineApi({ path: "/quiet", stream: () => undefined })], 20);
    expect(await readUntil(await fetch(`${origin}/quiet`), ": ping")).toContain(": ping\n\n");
  });

  it("closes every open stream before the server stops, rather than waiting on them", async () => {
    const { given, give } = handOut();
    // A server that closes only idle connections, as one does by default: an open stream is not
    // idle, so only the streams' own closing ends it.
    const { origin } = await serve([defineApi({ path: "/held", stream: give })], undefined, "idle");
    const response = await fetch(`${origin}/held`);
    const context = await given;
    const ended = readUntil(response, "never written");
    await app?.close();
    app = undefined;
    expect(context.signal.aborted).toBe(true);
    expect(await ended).toBe(": open\n\n");
  });

  it("answers no HEAD request, which carries no body and so would open a stream forever", async () => {
    let opened = 0;
    const { origin } = await serve([
      defineApi({ path: "/live", stream: () => void (opened += 1) }),
    ]);
    expect((await fetch(`${origin}/live`, { method: "HEAD" })).status).toBe(404);
    expect(opened).toBe(0);
  });

  it("closes a connection whose client stops reading, rather than holding what it is sent", async () => {
    const { given, give } = handOut();
    const { origin } = await serve([defineApi({ path: "/flood", stream: give })]);
    await fetch(`${origin}/flood`);
    const context = await given;
    const chunk = "x".repeat(100_000);
    for (let sent = 0; sent < 200 && !context.signal.aborted; sent += 1) {
      context.send("chunk", chunk);
    }
    expect(context.signal.aborted).toBe(true);
  });

  it("stops writing its heartbeat once the connection has closed", async () => {
    const started = vi.spyOn(globalThis, "setInterval");
    const cleared = vi.spyOn(globalThis, "clearInterval");
    const { given, give } = handOut();
    const { origin } = await serve([defineApi({ path: "/beat", stream: give })], 20);
    const controller = new AbortController();
    await fetch(`${origin}/beat`, { signal: controller.signal });
    const context = await given;
    const beat = started.mock.results.find((_, at) => started.mock.calls[at]?.[1] === 20)?.value;
    controller.abort();
    await new Promise<void>((resolve) => context.signal.addEventListener("abort", () => resolve()));
    expect(beat).toBeDefined();
    expect(cleared).toHaveBeenCalledWith(beat);
    started.mockRestore();
    cleared.mockRestore();
  });

  it("is behind the same access decision as every other route", async () => {
    const policy = {
      basic: { user: "u", password: "p" },
      authenticate: undefined,
      publicRoutes: [],
    };
    const { origin } = await serve(
      [defineApi({ path: "/private", stream: () => undefined })],
      undefined,
      true,
      (server) => registerAccess(server, policy, "default-src 'self'"),
    );
    expect((await fetch(`${origin}/private`)).status).toBe(401);
  });
});
