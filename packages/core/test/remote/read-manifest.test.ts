// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readManifest } from "@assemblejs/core";

const answers: Record<string, readonly [string, string]> = {
  "/ok": ["application/json", JSON.stringify({ assets: { css: ["/a.css"], js: ["/a.js"] } })],
  "/html": ["text/html", "{}"],
  "/broken": ["application/json", "{ not json"],
  "/wide": [
    "application/json",
    JSON.stringify({ assets: { js: ["https://evil.example/x.js", 7] } }),
  ],
};
const server = createServer((request, response) => {
  const answer = answers[request.url ?? ""];
  if (request.url === "/slow") return;
  if (request.url === "/moved") {
    response.writeHead(302, { location: "/ok" });
    response.end();
    return;
  }
  if (answer === undefined) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, { "content-type": answer[0] });
  response.end(answer[1]);
});
let origin = "";
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});
const read = (path: string, maxBytes = 1000) =>
  readManifest({ url: `${origin}${path}`, origin, maxBytes, deadline: 200 });

describe("reading a remote assembly's manifest", () => {
  it("answers its files, absolute against the remote's origin", async () => {
    expect(await read("/ok")).toEqual({ css: [`${origin}/a.css`], js: [`${origin}/a.js`] });
  });

  it("leaves out a file on any other origin, and anything that is not a url", async () => {
    expect(await read("/wide")).toEqual({ css: [], js: [] });
  });

  it("says why, for a status, a type, a size, a body or a deadline it cannot accept", async () => {
    expect(await read("/missing")).toMatch(/404/);
    expect(await read("/html")).toMatch(/text\/html/);
    expect(await read("/ok", 10)).toMatch(/larger than 10 bytes/);
    expect(await read("/broken")).toMatch(/not JSON/);
    expect(typeof (await read("/slow"))).toBe("string");
    // A redirect leaves the remote after it was checked, so it is refused, never followed.
    expect(typeof (await read("/moved"))).toBe("string");
  });
});
