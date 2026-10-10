// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.4 and 10, across two servers: a page places a parent from another server, and that
// server composed the parent's child before it answered. Both envelopes are the other
// server's, the page links what each of them needs, and the headers the page's composer sends
// are what that server holds its own children to.
import assert from "node:assert/strict";
import { test } from "node:test";
import { get, logged, originOf, treeOf } from "../http.mjs";

const producer = originOf("producer");
const fromProducer = (path, headers = {}) => fetch(new URL(path, producer), { headers });
const nameOf = (envelope) => envelope.attributes["data-name"];

test("a parent from another server arrives with the child that server composed inside it", async () => {
  const response = await get("/shelved");
  assert.equal(response.status, 200);
  const page = await response.text();
  const [shelf, ...others] = treeOf(page);
  assert.deepEqual(others, []);
  assert.equal(nameOf(shelf), "shelf");
  assert.deepEqual(shelf.children.map(nameOf), ["card"]);
  // Both came from the producer, and each says so: neither is mounted by the page's own runtime.
  for (const envelope of [shelf, ...shelf.children]) {
    assert.equal(envelope.attributes["data-remote"], producer, nameOf(envelope));
    assert.equal(envelope.attributes["data-failed"], undefined, nameOf(envelope));
  }
  assert.match(page, /<p class="card">rendered by the producer<\/p>/);
});

test("the page links what the nested assembly needs, read from that server's manifest of it", async () => {
  const page = await (await get("/shelved")).text();
  const head = page.slice(0, page.indexOf("</head>"));
  const sheets = [...head.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
  // The page asked for the shelf alone; the card's sheet is linked because the answer held it.
  const cards = sheets.filter((href) => href.startsWith(`${producer}/`) && /card/.test(href));
  assert.equal(cards.length, 1, `stylesheets: ${sheets.join(", ")}`);
  assert.equal((await fetch(cards[0])).status, 200);
  const scripts = [...page.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(
    scripts.some((src) => src.startsWith(`${producer}/`)),
    `no script from ${producer} in ${scripts.join(", ")}`,
  );
});

test("the producer refuses its own child by the ancestors and the depth it is sent", async () => {
  const whole = await fromProducer("/assembly/shelf/", { "assembly-depth": "1" });
  assert.equal(whole.status, 200);
  const [placed] = treeOf(await whole.text());
  assert.equal(placed.children[0]?.attributes["data-failed"], undefined);

  // The card named among the ancestors would be its own ancestor: refused before dispatch,
  // marked failed inside a parent that still answers, its id in the producer's own log.
  const byPath = await fromProducer("/assembly/shelf/", {
    "assembly-depth": "1",
    "assembly-path": "card/default",
  });
  assert.equal(byPath.status, 200);
  const [looped] = treeOf(await byPath.text());
  assert.equal(looped.attributes["data-failed"], undefined);
  assert.ok(await logged(looped.children[0]?.attributes["data-failed"], "producer"));

  // At the cap, a child would be one level past it.
  const byDepth = await fromProducer("/assembly/shelf/", { "assembly-depth": "8" });
  const [capped] = treeOf(await byDepth.text());
  assert.ok(await logged(capped.children[0]?.attributes["data-failed"], "producer"));
});
