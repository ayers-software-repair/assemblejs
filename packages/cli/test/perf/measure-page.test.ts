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
  "/kept-from": '<link rel="stylesheet" href="/members.css">',
  "/d.js": "d".repeat(70),
  "/e.js": "e".repeat(30),
  "/scripts":
    '<script src="/c.js" type="MODULE"></script><script src="/d.js"></script>' +
    '<link rel="modulepreload" href="/e.js"><script type="application/json" src="/data.json"></script>' +
    '<script nomodule src="/legacy.js"></script>',
  // A module that imports before it runs: two chunks, one of them twice and one in a circle
  // back to it, a file from another origin, and one more it only asks for later.
  "/modules":
    '<script type="module" src="/entry.js"></script><link rel="modulepreload" href="/ahead.js">' +
    '<script src="/classic.js"></script>',
  "/entry.js":
    'import { a } from "./chunk-a.js";\nimport "/shared.js";\nexport * from "./chunk-b.js";\n' +
    'export { c } from "./chunk-a.js";\nexport const later = () => import("./lazy.js");\nexport { a };',
  "/chunk-a.js":
    'import "./shared.js";\nimport "https://cdn.example/lib.js";\nexport const a = 1;\nexport const c = 2;',
  "/chunk-b.js": 'import "./entry.js";\nexport const b = 1;',
  "/shared.js": "export const shared = 1;",
  "/ahead.js": 'import "./shared.js";\nexport const ahead = 1;',
  // A classic script imports nothing, whatever its text holds.
  "/classic.js": "var text = 'import \"./never.js\";';",
  "/lazy.js": "export const lazy = 1;",
  "/unparsed": '<script type="module" src="/not-javascript.js"></script>',
  "/not-javascript.js": "this is ( not javascript",
  "/authored":
    '<link href="/a.css?x=1&#x26;y=2" rel="stylesheet" /><script src="/c.js" type="module"></script>' +
    '<link rel="stylesheet" href="https://cdn.example/font.css"><assembly-root data-name="cart" data-failed="8f212c16"></assembly-root>',
};
const asked: string[] = [];
const server = createServer((request, response) => {
  asked.push(request.url ?? "");
  const body = files[request.url ?? ""];
  if (request.url === "/slow") return;
  // What a server that guards an address answers a visitor who has not signed in.
  const refused = { "/staff": 401, "/members": 403, "/members.css": 401 }[request.url ?? ""];
  response.writeHead(refused ?? (body === undefined ? 404 : 200)).end(body);
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

  // Measured as a visitor who has not signed in, a page that is not shown to one has no weight
  // for one. Counted a failure, no project that guards a page could pass.
  it("answers no weight for a page a visitor who has not signed in is refused", async () => {
    expect(await measurePage(origin, "/staff")).toBeUndefined();
    expect(await measurePage(origin, "/members")).toBeUndefined();
    // A file an open page links is not the page: refused, it is a page that does not work.
    await expect(measurePage(origin, "/kept-from")).rejects.toThrow("/members.css answered 401");
  });

  it("reads tags an author wrote, names a file from another origin without fetching it, and the fallbacks", async () => {
    const weight = await measurePage(origin, "/authored");
    expect(weight?.styles).toEqual(bytes(files["/a.css?x=1&y=2"] ?? ""));
    expect(weight?.scripts).toEqual(bytes(files["/c.js"] ?? ""));
    expect(weight?.elsewhere).toEqual(["https://cdn.example/font.css"]);
    expect(weight?.fellBack).toEqual(["cart"]);
  });

  it("weighs every script the browser runs or preloads, and none it does not run", async () => {
    const weight = await measurePage(origin, "/scripts");
    expect(weight?.scripts).toEqual({
      bytes: [files["/c.js"], files["/d.js"], files["/e.js"]].join("").length,
      gzip: [files["/c.js"], files["/d.js"], files["/e.js"]]
        .map((file) => bytes(file ?? "").gzip)
        .reduce((total, size) => total + size, 0),
    });
    expect(asked).not.toContain("/data.json");
    expect(asked).not.toContain("/legacy.js");
  });

  // A page's one linked script was weighed and the chunks it imports were not: 576 bytes
  // reported for a page that loaded twenty thousand before anything mounted.
  it("weighs what a module script imports before it runs, each file once, and not what it asks for later", async () => {
    asked.length = 0;
    const weight = await measurePage(origin, "/modules");
    const loaded = [
      "/entry.js",
      "/chunk-a.js",
      "/chunk-b.js",
      "/shared.js",
      "/ahead.js",
      "/classic.js",
    ];
    expect(weight?.scripts).toEqual({
      bytes: loaded
        .map((file) => (files[file] ?? "").length)
        .reduce((total, size) => total + size, 0),
      gzip: loaded
        .map((file) => bytes(files[file] ?? "").gzip)
        .reduce((total, size) => total + size, 0),
    });
    for (const file of loaded)
      expect(
        asked.filter((url) => url === file),
        file,
      ).toHaveLength(1);
    expect(asked).not.toContain("/lazy.js");
    expect(asked).not.toContain("/never.js");
    // An import from another origin is named, as a file a page links from one is.
    expect(weight?.elsewhere).toEqual(["https://cdn.example/lib.js"]);
  });

  it("weighs a module it cannot read as JavaScript, and follows nothing from it", async () => {
    const weight = await measurePage(origin, "/unparsed");
    expect(weight?.scripts).toEqual(bytes(files["/not-javascript.js"] ?? ""));
  });

  it("abandons a request in flight when it is told to stop", async () => {
    const controller = new AbortController();
    const measuring = measurePage(origin, "/slow", controller.signal);
    setTimeout(() => controller.abort(), 50);
    await expect(measuring).rejects.toThrow();
  });
});
