// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEV_RELOAD_SCRIPT,
  DEV_RELOAD_SOURCE,
  DEV_RELOAD_STREAM,
  registerDevReload,
} from "@assemblejs/core";

const apps: FastifyInstance[] = [];
afterEach(async () => {
  for (const app of apps.splice(0)) await app.close();
});

const serve = async (): Promise<string> => {
  const app = Fastify({ logger: false, forceCloseConnections: true });
  apps.push(app);
  registerDevReload(app, () => undefined);
  return app.listen({ port: 0, host: "127.0.0.1" });
};

/** The boot a server's reload stream tells a connection. */
const bootOf = async (origin: string): Promise<string> => {
  const controller = new AbortController();
  const response = await fetch(`${origin}${DEV_RELOAD_STREAM}`, { signal: controller.signal });
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  let text = "";
  while (!text.includes("\n\ndata: ") || !text.endsWith("\n\n")) {
    const { done, value } = await reader.read();
    if (done) break;
    text += new TextDecoder().decode(value);
  }
  controller.abort();
  const line = text.split("\n").find((entry) => entry.startsWith("data: ")) ?? "";
  return (JSON.parse(line.slice("data: ".length)) as { payload: string }).payload;
};

describe("what reloads a page in development, mounted", () => {
  it("serves the script, never cached", async () => {
    const origin = await serve();
    const response = await fetch(`${origin}${DEV_RELOAD_SCRIPT}`);
    expect(response.headers.get("content-type")).toBe("text/javascript; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe(DEV_RELOAD_SOURCE);
  });

  it("tells every connection the same boot, and a server started again a new one", async () => {
    const first = await serve();
    const boot = await bootOf(first);
    expect(await bootOf(first)).toBe(boot);
    expect(await bootOf(await serve())).not.toBe(boot);
  });
});
