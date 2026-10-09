// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.1, 2.3, 5.2 and 10: an assembly placed from another server is the same envelope its
// own server answers, marked with its origin, and the page loads that server's script and its
// scoped stylesheet for it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { envelopesOf, get, originOf } from "../http.mjs";

const producer = originOf("producer");
const byName = (page, name) =>
  envelopesOf(page).find((envelope) => envelope.attributes["data-name"] === name);

test("a page places its own assembly and another server's, in the template's order", async () => {
  const response = await get("/");
  assert.equal(response.status, 200);
  const page = await response.text();
  assert.deepEqual(
    envelopesOf(page).map((envelope) => envelope.attributes["data-name"]),
    ["hello", "card", "tally"],
  );
  const card = byName(page, "card");
  assert.equal(card?.attributes["data-remote"], producer);
  assert.equal(card?.attributes["data-failed"], undefined);
  assert.match(card?.inner ?? "", /<p class="card">rendered by the producer<\/p>/);
  assert.equal(byName(page, "hello")?.attributes["data-remote"], undefined, "a local one is not");
});

test("the page loads the remote's own script, which its server serves to any origin", async () => {
  const page = await (await get("/")).text();
  const scripts = [...page.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]);
  const remote = scripts.filter((src) => src.startsWith(`${producer}/`));
  assert.ok(remote.length > 0, `no script from ${producer} in ${scripts.join(", ")}`);
  for (const src of remote) {
    const response = await fetch(src);
    assert.equal(response.status, 200, src);
    assert.match(response.headers.get("content-type") ?? "", /javascript/);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
  }
});

test("the page's policy lets it load from the remote it declared, and from nowhere else", async () => {
  const policy = (await get("/")).headers.get("content-security-policy") ?? "";
  const scripts = /script-src ([^;]*)/.exec(policy)?.[1] ?? "";
  assert.ok(scripts.split(/\s+/).includes(producer), policy);
  assert.ok(!/\*/.test(scripts), `no wildcard: ${policy}`);
});

test("the page links the remote's stylesheet, scoped to its envelope (DESIGN 10)", async () => {
  const page = await (await get("/")).text();
  const head = page.slice(0, page.indexOf("</head>"));
  const sheets = [...head.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
  const remote = sheets.filter((href) => href.startsWith(`${producer}/`));
  assert.equal(remote.length, 1, `stylesheets: ${sheets.join(", ")}`);
  const response = await fetch(remote[0]);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/css/);
  const css = await response.text();
  assert.match(css, /assembly-root\[data-name="card"\]\s+\.card/);
  assert.ok(!/(^|[\s,}]):root\b/.test(css), "a rule at the document starts at the envelope");
});
