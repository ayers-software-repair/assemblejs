// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRemoteTransport } from "@assemblejs/core";
import type { AssemblyRequest, RemoteTransport } from "@assemblejs/core";

// A server whose shell composes a cart inside its answer, as a view that places a child does.
const envelope = (name: string, inside: string): string =>
  `<assembly-root data-name="${name}" data-id="i-${name}" data-view="default" data-renderer="html">${inside}</assembly-root>`;
const producer = createHttpServer((request, response) => {
  const manifest = /^\/assembly\/([a-z]+)\/default\/manifest\/$/.exec(request.url ?? "")?.[1];
  if (manifest !== undefined) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ assets: { css: [`/${manifest}.css`], js: ["/client.js"] } }));
    return;
  }
  response.writeHead(200, { "content-type": "text/html", "assembly-version": "v1" });
  response.end(envelope("shell", envelope("cart", "<p>two items</p>")));
});
let origin = "";

beforeAll(async () => {
  await new Promise<void>((resolve) => producer.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((producer.address() as AddressInfo).port)}`;
});
afterAll(async () => {
  await new Promise((resolve) => producer.close(resolve));
});

describe("the way to reach other servers", () => {
  it("is a fetch per url and the files each remote assembly declared", async () => {
    const transport: RemoteTransport = {
      fetch: async () => ({ ok: true, html: "", source: "remote" }),
      assets: async () => undefined,
    };
    expect(await transport.assets("https://a.example.com/assembly/cart/")).toBeUndefined();
    expect((await transport.fetch("u", {} as never)).ok).toBe(true);
  });

  it("answers, for a url, the files of the assembly there and of each one its answer held", async () => {
    const transport = createRemoteTransport({
      remotes: [{ origin }],
      maxBytes: 1024 * 1024,
      log: () => undefined,
    });
    const url = `${origin}/assembly/shell/`;
    const request: AssemblyRequest = {
      name: "shell",
      view: "default",
      id: "5f0c7a1e-3a59-4a0f-9d9a-2f1b8c7d6e5a",
      page: "0b1d2c3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e",
      depth: 1,
      path: [],
      query: new URLSearchParams(),
      params: {},
      headers: {},
      signal: new AbortController().signal,
    };
    const answer = await transport.fetch(url, request);
    expect(answer.ok && answer.html.match(/data-remote=/g)).toHaveLength(2);
    // The shell's own sheet and the cart's, each from its manifest; the one script once per each.
    expect(await transport.assets(url)).toEqual({
      css: [`${origin}/shell.css`, `${origin}/cart.css`],
      js: [`${origin}/client.js`, `${origin}/client.js`],
    });
  });
});
