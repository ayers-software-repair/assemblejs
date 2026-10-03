// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { defineApi, registerStreams } from "@assemblejs/core";
import type { LogLine, StreamApi, StreamContext } from "@assemblejs/core";

let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

/** Listens with the given streams, and answers its origin and the log it wrote. */
const serve = async (
  streams: readonly StreamApi[],
  heartbeat?: number,
  force: boolean | "idle" = true,
) => {
  const logged: LogLine[] = [];
  // Node's fetch can hold a spare connection that never sends a request, which a server that
  // closes only idle connections waits out; this stops the test's server, not the stream, at once.
  app = Fastify({ logger: false, forceCloseConnections: force });
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
});
