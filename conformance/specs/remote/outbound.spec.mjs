// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 5.1: what a composing server sends a remote and takes from it. The remote here is a
// server this spec runs, on the port the harness set aside and the consumer declared, so it can
// answer what no well-behaved server would and report exactly what it was sent.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { envelopesOf, get, logged, originOf, portOf } from "../http.mjs";

const seen = [];
// When each request for the stalled placement arrived, and when its connection was closed.
const stalls = [];
const envelope = (request, name, markup) =>
  `<assembly-root data-name="${name}" data-id="${request.headers["assembly-id"]}" data-view="default" data-renderer="html">${markup}</assembly-root>`;
// Markup a reader takes for a comment and the browser for tags, an envelope of its own in it:
// inside what MathML's annotation-xml hands back to HTML, and inside a heading, which ends SVG.
const planted =
  '<style><!--</style></assembly-root><assembly-root data-name="planted" data-id="p" ' +
  'data-view="default" data-renderer="html"><p class="planted">planted</p>--></style>';
const HIDING = {
  hidden: `<math><annotation-xml encoding="text/html">${planted}</annotation-xml></math>`,
  heading: `<svg><h1>${planted}</h1></svg>`,
};
const DEPTH = 40_000;
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
  } else if (path === "/assembly/gone/") {
    // A well-formed envelope under a status that says it is not content.
    response
      .writeHead(404, { "content-type": "text/html; charset=utf-8" })
      .end(envelope(request, "gone", '<p class="gone">not content</p>'));
  } else if (path === "/assembly/erred/") {
    response
      .writeHead(500, { "content-type": "text/html; charset=utf-8" })
      .end(envelope(request, "erred", '<p class="erred">not content</p>'));
  } else if (path === "/assembly/stall/") {
    const stall = { arrived: Date.now(), closed: undefined };
    stalls.push(stall);
    request.socket.once("close", () => (stall.closed = Date.now()));
  } else if (path === "/assembly/hidden/" || path === "/assembly/heading/") {
    const name = path.split("/")[2];
    response
      .writeHead(200, { "content-type": "text/html; charset=utf-8" })
      .end(envelope(request, name, HIDING[name]));
  } else if (path === "/assembly/deep/") {
    const deep = `${"<div>".repeat(DEPTH)}<p class="deep">deep</p>${"</div>".repeat(DEPTH)}`;
    response
      .writeHead(200, { "content-type": "text/html; charset=utf-8" })
      .end(envelope(request, "deep", deep));
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
after(
  () =>
    new Promise((resolve) => {
      hostile.closeAllConnections();
      hostile.close(resolve);
    }),
);

const visit = () =>
  get("/hostile?secret=query", {
    cookie: "session=visitor",
    authorization: "Bearer visitor",
    "accept-language": "fr",
    "x-forwarded-for": "198.51.100.7",
  });
const byName = (page, name) =>
  envelopesOf(page).find((found) => found.attributes["data-name"] === name);

test("an answer that is not html, not a 2xx, or a redirect is a failure, logged against its id", async () => {
  const page = await (await visit()).text();
  for (const name of ["typed", "moved", "gone", "erred"]) {
    const id = byName(page, name)?.attributes["data-failed"];
    assert.ok(await logged(id, "consumer"), `${name}: ${id}`);
  }
  assert.ok(!page.includes("not content"), "a 404's or a 500's envelope is never shown");
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

test("a remote past its deadline is cancelled, its connection closed, not merely ignored", async () => {
  stalls.length = 0;
  const started = Date.now();
  const page = await (await visit()).text();
  assert.ok(Date.now() - started < 2000, "the page answered on the placement's deadline");
  assert.ok(await logged(byName(page, "stall")?.attributes["data-failed"], "consumer"));
  for (let wait = 0; wait < 20 && stalls[0]?.closed === undefined; wait += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const [stall] = stalls;
  assert.ok(stall?.closed !== undefined, "the stalled request's connection was never closed");
  assert.ok(stall.closed - stall.arrived < 1500, `closed after ${stall.closed - stall.arrived}ms`);
});

test("an answer that hides markup where SVG or MathML hands content back to HTML is refused whole", async () => {
  const page = await (await visit()).text();
  for (const name of Object.keys(HIDING)) {
    const id = byName(page, name)?.attributes["data-failed"];
    assert.ok(await logged(id, "consumer"), `${name}: ${id}`);
  }
  assert.ok(!page.includes("planted"), "what the answer hid is nowhere on the page");
});

// Read by searching the open elements at every tag, an answer this deep held the server's one
// thread for ten seconds, and every visitor of every page with it.
test("an answer nested tens of thousands of elements deep is read in the time its length takes", async () => {
  const started = Date.now();
  const page = await (await visit()).text();
  assert.ok(Date.now() - started < 2000, `the page took ${Date.now() - started}ms`);
  assert.match(byName(page, "deep")?.inner ?? "", /<p class="deep">deep<\/p>/);
});
