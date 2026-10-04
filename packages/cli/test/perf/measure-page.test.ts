// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { measurePage, weigh } from "@assemblejs/cli";

const files: Record<string, string> = {
  "/": '<head><link rel="stylesheet" href="/a.css?x=1&amp;y=2"><link rel="stylesheet" href="/a.css?x=1&amp;y=2"></head><body><script type="module" src="/c.js"></script></body>',
  "/a.css?x=1&y=2": "p { color: red }",
  "/c.js": "export {};".repeat(100),
  "/missing": '<link rel="stylesheet" href="/gone.css">',
  "/authored":
    '<link href="/a.css?x=1&#x26;y=2" rel="stylesheet" /><script src="/c.js" type="module"></script>' +
    '<link rel="stylesheet" href="https://cdn.example/font.css"><assembly-root data-name="cart" data-failed="8f212c16"></assembly-root>',
};
const asked: string[] = [];
const server = createServer((request, response) => {
  asked.push(request.url ?? "");
  const body = files[request.url ?? ""];
  response.writeHead(body === undefined ? 404 : 200).end(body);
});
let origin = "";
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const bytes = (text: string) => weigh(new TextEncoder().encode(text));

describe("measuring a page", () => {
  it("weighs the document and each stylesheet and script it links, each once", async () => {
    const weight = await measurePage(origin, "/");
    expect(weight).toEqual({
      route: "/",
      document: bytes(files["/"] ?? ""),
      styles: bytes(files["/a.css?x=1&y=2"] ?? ""),
      scripts: bytes(files["/c.js"] ?? ""),
      elsewhere: [],
      fellBack: [],
    });
    expect(asked.filter((url) => url.startsWith("/a.css"))).toHaveLength(1);
  });

  it("fails on anything not answered, rather than weighing it as nothing", async () => {
    await expect(measurePage(origin, "/missing")).rejects.toThrow("/gone.css answered 404");
  });

  it("reads tags an author wrote, names a file from another origin without fetching it, and the fallbacks", async () => {
    const weight = await measurePage(origin, "/authored");
    expect(weight.styles).toEqual(bytes(files["/a.css?x=1&y=2"] ?? ""));
    expect(weight.scripts).toEqual(bytes(files["/c.js"] ?? ""));
    expect(weight.elsewhere).toEqual(["https://cdn.example/font.css"]);
    expect(weight.fellBack).toEqual(["cart"]);
  });
});
