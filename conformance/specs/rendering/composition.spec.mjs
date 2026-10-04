// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.3 and 12, on a page of every renderer: each placement settles on its own, in the
// template's order, and the one that fails is marked, contained and never explained to a visitor.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attributesOf, envelopesOf, get, logged } from "../http.mjs";

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
      assert.ok(await logged(failed), `the id ${failed} is the one its failure is logged against`);
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
  assert.ok(await logged(broken.attributes["data-failed"]));
  assert.match(broken.inner, /<p class="stand-in">stand-in<\/p>/);
});

test("a placement declared required fails its page with 503 and an id, nothing else", async () => {
  const response = await get("/strict");
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.ok(!body.includes("plain html") && !body.includes(CAUSE));
  assert.ok(await logged(JSON.parse(body).error.correlationId));
});

test("the failing view's own content endpoint answers its fallback envelope under 500", async () => {
  const response = await get("/assembly/broken/");
  assert.equal(response.status, 500);
  const body = await response.text();
  assert.ok(!body.includes(CAUSE));
  assert.equal(attributesOf(body)["data-name"], "broken");
  assert.ok(await logged(attributesOf(body)["data-failed"]));
});

test("every failure has an id of its own, never one shared by two", async () => {
  const idOf = async () =>
    envelopesOf(await (await get("/")).text()).find(
      (envelope) => envelope.attributes["data-name"] === "broken",
    )?.attributes["data-failed"];
  const [first, second] = [await idOf(), await idOf()];
  assert.ok(first !== undefined && second !== undefined);
  assert.notEqual(first, second);
});

test("a declared fallback is shown before what another page's placement cached", async () => {
  // The first call answers, and the page that declared a lifetime caches it.
  const kept = await (await get("/keeps")).text();
  assert.match(kept, /<p class="flaky">flaky, answering<\/p>/);
  // The second fails: a page that declared no lifetime shows its own fallback, marked failed,
  // never the other page's cached content.
  const stood = envelopesOf(await (await get("/stands-in")).text())[0];
  assert.match(stood?.inner ?? "", /<p class="stand-in">stand-in<\/p>/);
  assert.ok(await logged(stood?.attributes["data-failed"]));
  assert.ok(!(stood?.inner ?? "").includes("flaky, answering"));
});

test("a page of static assemblies alone ships no JavaScript at all", async () => {
  const page = await (await get("/still")).text();
  const scripts = [...page.matchAll(/<script\b[^>]*>/g)].map((match) => match[0]);
  assert.ok(
    scripts.every((tag) => tag.includes('type="application/json"')),
    `a script on a static page: ${scripts.join(" ")}`,
  );
  const home = await (await get("/")).text();
  assert.match(home, /<script type="module" src="[^"]+"/, "a page with a framework view has one");
});
