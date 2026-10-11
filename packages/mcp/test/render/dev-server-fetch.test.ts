// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer } from "node:http";
import type { IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { devServerFetch } from "@assemblejs/mcp";

const asked: { url: string; headers: IncomingHttpHeaders }[] = [];
const server = createServer((request, response) => {
  asked.push({ url: request.url ?? "", headers: request.headers });
  if (request.url?.startsWith("/assembly/counter/") === true) {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end('<assembly-root data-name="counter"><p>0</p></assembly-root>');
  } else if (request.url?.startsWith("/assembly/json/") === true) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end("{}");
  } else {
    response.writeHead(500, { "content-type": "text/html" });
    response.end("<p>broken</p>");
  }
});
let origin = "";
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const request = (name: string) => ({
  name,
  view: "default",
  id: "preview-1",
  page: "preview",
  depth: 2,
  path: ["shell/default"],
  query: new URLSearchParams("note=hi"),
  params: { sku: "a1" },
  headers: {},
  signal: new AbortController().signal,
});

describe("asking the project's dev server for a placement", () => {
  it("asks the content endpoint with the composition headers and the query, and answers the html", async () => {
    const answer = await devServerFetch(origin)(request("counter"));
    expect(answer).toEqual({
      ok: true,
      html: '<assembly-root data-name="counter"><p>0</p></assembly-root>',
      source: "remote",
    });
    const [sent] = asked.splice(0);
    expect(sent?.url).toBe("/assembly/counter/default/?note=hi");
    expect(sent?.headers).toMatchObject({
      accept: "text/html",
      "assembly-id": "preview-1",
      "assembly-page": "preview",
      "assembly-depth": "2",
      "assembly-path": "shell/default",
      "assembly-params": "sku=a1",
    });
  });

  it("answers a failure the composer's ladder covers for, for a status, a type, or no server", async () => {
    expect(await devServerFetch(origin)(request("broken"))).toMatchObject({
      ok: false,
      reason: "status",
    });
    expect(await devServerFetch(origin)(request("json"))).toMatchObject({
      ok: false,
      reason: "content-type",
    });
    expect(await devServerFetch("http://127.0.0.1:9")(request("counter"))).toMatchObject({
      ok: false,
      reason: "transport",
    });
  });
});
