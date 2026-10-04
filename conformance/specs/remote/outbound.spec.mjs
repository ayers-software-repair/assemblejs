// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 5.1: what a composing server sends a remote and takes from it. The remote here is a
// server this spec runs, on the port the harness set aside and the consumer declared, so it can
// answer what no well-behaved server would and report exactly what it was sent.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { envelopesOf, get, originOf, portOf } from "../http.mjs";

const seen = [];
const envelope = (request, name, markup) =>
  `<assembly-root data-name="${name}" data-id="${request.headers["assembly-id"]}" data-view="default" data-renderer="html">${markup}</assembly-root>`;
const hostile = createServer((request, response) => {
  const path = new URL(request.url ?? "/", "http://hostile").pathname;
  if (path === "/assembly/typed/") {
    response.writeHead(200, { "content-type": "application/json" }).end('{"not":"html"}');
  } else if (path === "/assembly/moved/") {
    response.writeHead(302, { location: `${originOf("producer")}/assembly/card/` }).end();
  } else if (path === "/assembly/cookie/") {
    response
      .writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "set-cookie": "hostile=1; Path=/",
        "x-hostile": "1",
      })
      .end(envelope(request, "cookie", '<p class="kept">kept</p>'));
  } else if (path === "/assembly/seen/") {
    seen.push({ url: request.url, headers: request.headers });
    response
      .writeHead(200, { "content-type": "text/html; charset=utf-8" })
      .end(envelope(request, "seen", '<p class="seen">seen</p>'));
  } else {
    response.writeHead(404).end();
  }
});
before(() => new Promise((resolve) => hostile.listen(portOf("hostile"), "127.0.0.1", resolve)));
after(() => new Promise((resolve) => hostile.close(resolve)));

const visit = () =>
  get("/hostile?secret=query", {
    cookie: "session=visitor",
    authorization: "Bearer visitor",
    "accept-language": "fr",
    "x-forwarded-for": "198.51.100.7",
  });
const byName = (page, name) =>
  envelopesOf(page).find((found) => found.attributes["data-name"] === name);

test("an answer that is not html, and a redirect, are failures, the redirect never followed", async () => {
  const page = await (await visit()).text();
  for (const name of ["typed", "moved"]) {
    assert.match(byName(page, name)?.attributes["data-failed"] ?? "", /\S+/, name);
  }
  assert.ok(!page.includes('{"not":"html"}'));
  assert.ok(!page.includes("rendered by the producer"), "the redirect led nowhere");
});

test("a remote's response headers go no further than the composing server", async () => {
  const response = await visit();
  const page = await response.text();
  assert.match(byName(page, "cookie")?.inner ?? "", /<p class="kept">kept<\/p>/);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("x-hostile"), null);
});

test("nothing of the visitor's is forwarded but what the remote declared", async () => {
  seen.length = 0;
  await (await visit()).text();
  assert.equal(seen.length, 1);
  const [{ url, headers }] = seen;
  assert.ok(!url.includes("secret"), `the page's query reached the remote: ${url}`);
  for (const name of ["cookie", "authorization", "x-forwarded-for"]) {
    assert.equal(headers[name], undefined, `${name} was forwarded`);
  }
  assert.equal(headers["accept-language"], "fr", "a declared key is forwarded");
  assert.match(headers["assembly-id"] ?? "", /^[0-9a-f-]{36}$/);
  assert.match(headers["assembly-page"] ?? "", /^[0-9a-f-]{36}$/);
});
