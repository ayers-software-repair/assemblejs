// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.3 and 12, on a page of every renderer: each placement settles on its own, in the
// template's order, and the one that fails is marked, contained and never explained to a visitor.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attributesOf, envelopesOf, get } from "../http.mjs";

const ORDER = [
  "plain",
  "notes",
  "ejs-card",
  "handlebars-card",
  "broken",
  "nunjucks-card",
  "pug-card",
  "react-label",
  "preact-label",
  "solid-label",
  "svelte-label",
  "vue-label",
  "lit-label",
];
const CAUSE = "this view always fails to render";

test("a page of every renderer answers one document, every placement in the template's order", async () => {
  const response = await get("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html/);
  const page = await response.text();
  assert.match(page, /^<!doctype html>/i);
  assert.ok(!/<assembly[\s>]/i.test(page), "no placement directive is ever emitted");
  assert.deepEqual(
    envelopesOf(page).map((envelope) => envelope.attributes["data-name"]),
    ORDER,
  );
});

test("the placement that fails is marked with an id, and every other one renders", async () => {
  const page = await (await get("/")).text();
  for (const envelope of envelopesOf(page)) {
    const failed = envelope.attributes["data-failed"];
    if (envelope.attributes["data-name"] === "broken") {
      assert.match(failed ?? "", /\S+/);
    } else {
      assert.equal(failed, undefined, envelope.attributes["data-name"]);
      assert.ok(envelope.inner.trim() !== "", envelope.attributes["data-name"]);
    }
  }
  assert.ok(!page.includes(CAUSE), "the cause never reaches a body");
});

test("a declared fallback is what the failed placement shows, still marked failed", async () => {
  const response = await get("/guarded");
  assert.equal(response.status, 200);
  const broken = envelopesOf(await response.text()).find(
    (envelope) => envelope.attributes["data-name"] === "broken",
  );
  assert.ok(broken !== undefined);
  assert.match(broken.attributes["data-failed"] ?? "", /\S+/);
  assert.match(broken.inner, /<p class="stand-in">stand-in<\/p>/);
});

test("a placement declared required fails its page with 503 and an id, nothing else", async () => {
  const response = await get("/strict");
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.ok(!body.includes("plain html") && !body.includes(CAUSE));
  assert.match(JSON.parse(body).error.correlationId, /\S+/);
});

test("the failing view's own content endpoint answers its fallback envelope under 500", async () => {
  const response = await get("/assembly/broken/");
  assert.equal(response.status, 500);
  const body = await response.text();
  assert.ok(!body.includes(CAUSE));
  assert.equal(attributesOf(body)["data-name"], "broken");
  assert.match(attributesOf(body)["data-failed"] ?? "", /\S+/);
});
