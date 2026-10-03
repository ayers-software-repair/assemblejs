// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRemoteTransport } from "@assemblejs/core";
import type { AssemblyRequest, LogLine } from "@assemblejs/core";

// A remote server that misbehaves on purpose, one route per way a remote can be wrong.
let manifestReads = 0;
const remote = createHttpServer((request, response) => {
  const envelope = (body: string) =>
    `<assembly-root data-name="echo" data-id="x" data-view="default" data-renderer="html">${body}</assembly-root>`;
  switch (request.url) {
    case "/assembly/echo/":
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "assembly-version": "v1",
        "set-cookie": "remote=1",
      });
      response.end(envelope(JSON.stringify(request.headers)));
      return;
    case "/assembly/echo/default/manifest/":
      manifestReads += 1;
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ assets: { css: [], js: ["/_assemblejs/assets/r.js"] } }));
      return;
    case "/assembly/redirect/":
      response.writeHead(302, { location: "/assembly/echo/" });
      response.end();
      return;
    case "/assembly/slow/":
      return; // never answers
    case "/assembly/json/":
      response.writeHead(200, { "content-type": "application/json" });
      response.end("{}");
      return;
    case "/assembly/big/":
      response.writeHead(200, { "content-type": "text/html" });
      response.end(envelope("x".repeat(5000)));
      return;
    case "/assembly/fragment/":
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<p>not an envelope</p>");
      return;
    default:
      response.writeHead(500);
      response.end();
  }
});
let origin = "";
beforeAll(async () => {
  await new Promise<void>((resolve) => remote.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((remote.address() as AddressInfo).port)}`;
});
afterAll(async () => {
  remote.closeAllConnections();
  await new Promise((resolve) => remote.close(resolve));
});

const logged: LogLine[] = [];
const transport = (forward?: string[], maxBytes = 2 * 1024 * 1024) =>
  createRemoteTransport({
    remotes: [{ origin, ...(forward === undefined ? {} : { forward }) }],
    maxBytes,
    log: (line) => logged.push(line),
  });
const request = (over: Partial<AssemblyRequest> = {}): AssemblyRequest => ({
  name: "echo",
  view: "default",
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  page: "9a8b7c6d-4f89-41d3-9a0c-0305e82c3301",
  depth: 1,
  path: ["home/default"],
  query: new URLSearchParams("secret=1"),
  headers: { cookie: "session=hunter2", authorization: "Bearer t", "accept-language": "fr" },
  signal: AbortSignal.timeout(2000),
  ...over,
});

describe("reaching an assembly on another server", () => {
  it("renders it, stamped with its origin, sending the composition headers and nothing else", async () => {
    const answer = await transport().fetch(`${origin}/assembly/echo/`, request());
    expect(answer.ok).toBe(true);
    if (!answer.ok) return;
    expect(answer.source).toBe("remote");
    expect(answer.version).toBe("v1");
    expect(answer.html).toContain(`data-remote="${origin}"`);
    expect(answer.html).toContain('"assembly-depth":"1"');
    expect(answer.html).toContain('"assembly-path":"home/default"');
    // Not the cookie, not authorization, not the visitor's language, and not the query.
    expect(answer.html).not.toContain("hunter2");
    expect(answer.html).not.toContain("authorization");
    // Node's fetch sends its own accept-language; the visitor's, fr, never goes.
    expect(answer.html).not.toContain('"accept-language":"fr"');
    expect(answer.html).not.toContain("secret");
  });

  it("forwards exactly the keys the remote declared", async () => {
    const answer = await transport(["accept-language"]).fetch(
      `${origin}/assembly/echo/`,
      request(),
    );
    expect(answer.ok && answer.html).toContain('"accept-language":"fr"');
    expect(answer.ok && answer.html).not.toContain("hunter2");
  });

  it("reads the manifest once per version, and links its files absolutely", async () => {
    const reaching = transport();
    const before = manifestReads;
    await reaching.fetch(`${origin}/assembly/echo/`, request());
    await reaching.fetch(`${origin}/assembly/echo/`, request());
    expect(manifestReads).toBe(before + 1);
    expect(reaching.assets(`${origin}/assembly/echo/`)).toEqual({
      css: [],
      js: [`${origin}/_assemblejs/assets/r.js`],
    });
  });

  it("refuses a redirect, rather than follow it off the allowlist", async () => {
    const answer = await transport().fetch(`${origin}/assembly/redirect/`, request());
    expect(answer).toMatchObject({ ok: false, reason: "transport" });
  });

  it("is a failure for a status, a type, a size or a shape the contract does not allow", async () => {
    const reaching = transport(undefined, 1000);
    expect(await reaching.fetch(`${origin}/assembly/broken/`, request())).toMatchObject({
      reason: "status",
    });
    expect(await reaching.fetch(`${origin}/assembly/json/`, request())).toMatchObject({
      reason: "content-type",
    });
    expect(await reaching.fetch(`${origin}/assembly/big/`, request())).toMatchObject({
      reason: "too-large",
    });
    expect(await reaching.fetch(`${origin}/assembly/fragment/`, request())).toMatchObject({
      reason: "invalid",
    });
  });

  it("is cancelled by the caller's deadline, never left holding a socket", async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);
    const answer = await transport().fetch(
      `${origin}/assembly/slow/`,
      request({ signal: controller.signal }),
    );
    expect(answer).toMatchObject({ ok: false, reason: "transport" });
  });

  it("refuses a url that is not a declared remote's content endpoint", async () => {
    for (const url of [
      "https://elsewhere.example.com/assembly/echo/",
      `${origin}/not-the-contract/`,
    ]) {
      expect(await transport().fetch(url, request())).toMatchObject({
        ok: false,
        reason: "invalid",
      });
    }
  });

  it("refuses a declared host that resolves inside this server's network", async () => {
    const internal = createRemoteTransport({
      remotes: [{ origin: "http://internal.example.test" }],
      maxBytes: 1000,
      log: () => undefined,
      resolve: async () => ["10.0.0.5"],
    });
    expect(
      await internal.fetch("http://internal.example.test/assembly/echo/", request()),
    ).toMatchObject({
      ok: false,
      reason: "transport",
      detail: expect.stringMatching(/inside this server/),
    });
  });

  it("logs every failure against the id it answers with", async () => {
    const answer = await transport().fetch(`${origin}/assembly/broken/`, request());
    expect(!answer.ok && logged.some((line) => line.correlationId === answer.correlationId)).toBe(
      true,
    );
  });
});
