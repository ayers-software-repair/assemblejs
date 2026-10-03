// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import {
  DEV_RELOAD_SCRIPT,
  DEV_RELOAD_SOURCE,
  DEV_RELOAD_STREAM,
  registerAccess,
  registerDevReload,
} from "@assemblejs/core";

const apps: FastifyInstance[] = [];
afterEach(async () => {
  for (const app of apps.splice(0)) await app.close();
});

const serve = async (boot = "the-boot"): Promise<string> => {
  const app = Fastify({ logger: false, forceCloseConnections: true });
  apps.push(app);
  registerDevReload(app, () => undefined, boot);
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

  it("tells every connection the boot it was given, which its pages carry", async () => {
    const origin = await serve("b1");
    expect([await bootOf(origin), await bootOf(origin)]).toEqual(["b1", "b1"]);
  });

  it("is behind the same access decision as every other route", async () => {
    const app = Fastify({ logger: false, forceCloseConnections: true });
    apps.push(app);
    registerAccess(
      app,
      { basic: { user: "u", password: "p" }, authenticate: undefined, publicRoutes: [] },
      "",
    );
    registerDevReload(app, () => undefined, "b");
    const origin = await app.listen({ port: 0, host: "127.0.0.1" });
    for (const path of [DEV_RELOAD_SCRIPT, DEV_RELOAD_STREAM]) {
      expect((await fetch(`${origin}${path}`)).status, path).toBe(401);
    }
  });
});
