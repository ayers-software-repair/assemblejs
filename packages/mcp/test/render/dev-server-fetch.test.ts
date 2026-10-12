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
  } else if (request.url?.startsWith("/assembly/failing/") === true) {
    response.writeHead(500, { "content-type": "text/html; charset=utf-8" });
    response.end(
      '<assembly-root data-name="failing" data-id="0b9f4c1e-6a55-4f0d-9d1c-2f6f3f1f7a10" data-view="default" data-renderer="" data-failed="c0ffee12"></assembly-root>',
    );
  } else if (request.url?.startsWith("/assembly/refused/") === true) {
    response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    response.end(
      '{"error":{"correlationId":"feedf00d","headers":["assembly-id is not a uuid","assembly-depth is not a whole number"]}}',
    );
  } else if (request.url?.startsWith("/assembly/holder/") === true) {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(
      '<assembly-root data-name="holder"><assembly-root data-name="price" data-failed="deadbeef"></assembly-root><assembly-root data-name="tag" data-failed=""></assembly-root></assembly-root>',
    );
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

// Ids of the shape the content endpoint holds a request to (DESIGN 2.1).
const ID = "0b9f4c1e-6a55-4f0d-9d1c-2f6f3f1f7a10";
const PAGE = "7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f";
const request = (name: string) => ({
  name,
  view: "default",
  id: ID,
  page: PAGE,
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
      "assembly-id": ID,
      "assembly-page": PAGE,
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

  it("answers a failed assembly with the id that server logged it against, and says so once", async () => {
    const said: { correlationId: string; message: string }[] = [];
    const fetch = devServerFetch(origin, (line) => said.push(line));
    expect(await fetch(request("failing"))).toMatchObject({
      ok: false,
      reason: "status",
      correlationId: "c0ffee12",
    });
    expect(said).toEqual([
      {
        correlationId: "c0ffee12",
        message:
          '"failing" failed on the dev server, which answered 500: its log says why, against c0ffee12',
        stack: undefined,
      },
    ]);
    // An answer that is no envelope of the assembly's carries no id, and nothing is said of it.
    expect(await fetch(request("broken"))).toMatchObject({ ok: false, correlationId: "" });
    expect(said).toHaveLength(1);
  });

  it("says each placement that fell back inside an answer that stands, by its id where it has one", async () => {
    const inside: string[] = [];
    const fetch = devServerFetch(origin, undefined, (problem) => inside.push(problem));
    expect((await fetch(request("holder"))).ok).toBe(true);
    expect(inside).toEqual([
      '"price" fell back inside "holder" on the dev server: its log says why, against deadbeef',
      '"tag" fell back inside "holder" on the dev server: it gave no id and logged nothing, as it does for a placement it will not show to the one asking',
    ]);
    expect((await fetch(request("counter"))).ok).toBe(true);
    expect(inside).toHaveLength(2);
  });

  it("says what the server said was wrong with a request it refused, by the id it logged it against", async () => {
    const said: { correlationId: string; message: string }[] = [];
    const answer = await devServerFetch(origin, (line) => said.push(line))(request("refused"));
    expect(answer).toMatchObject({
      ok: false,
      reason: "status",
      correlationId: "feedf00d",
      detail: expect.stringMatching(
        / answered 400: assembly-id is not a uuid; assembly-depth is not a whole number$/,
      ),
    });
    expect(said.map((line) => line.message)).toEqual([
      'the dev server refused the request for "refused" (400): assembly-id is not a uuid; assembly-depth is not a whole number',
    ]);
  });
});
