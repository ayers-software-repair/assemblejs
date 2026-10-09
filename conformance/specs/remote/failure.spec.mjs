// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.3 and 5.1 across servers: a remote that fails, is missing, answers too much or too
// late is contained in its own placement; a page dies of it only when it said it would.
import assert from "node:assert/strict";
import { test } from "node:test";
import { envelopesOf, get, logged } from "../http.mjs";

const byName = (page, name) =>
  envelopesOf(page).find((envelope) => envelope.attributes["data-name"] === name);

test("a remote's 500, a 404 and an answer past the cap each fail only their placement", async () => {
  const response = await get("/failing");
  assert.equal(response.status, 200);
  const page = await response.text();
  for (const name of ["broken", "missing", "huge"]) {
    const envelope = byName(page, name);
    assert.ok(envelope !== undefined, name);
    const id = envelope.attributes["data-failed"];
    assert.ok(await logged(id, "consumer"), `${name}: ${id} is logged`);
  }
  const ids = ["broken", "missing", "huge"].map(
    (name) => byName(page, name)?.attributes["data-failed"],
  );
  assert.equal(new Set(ids).size, 3, `every failure has an id of its own: ${ids.join(", ")}`);
  assert.match(byName(page, "card")?.inner ?? "", /rendered by the producer/);
  assert.ok(!page.includes("secret detail"), "a remote's cause never reaches the page");
  assert.ok(!page.includes("never shown") && !page.includes("xxxxxxxx"));
  assert.ok(page.length < 1024 * 1024, "nothing past the cap is passed on");
});

test("a remote slower than its deadline is cut off, and the page shows its fallback", async () => {
  const started = Date.now();
  const response = await get("/slow");
  const elapsed = Date.now() - started;
  assert.equal(response.status, 200);
  assert.ok(elapsed < 1400, `the page waited ${elapsed}ms for a 300ms deadline`);
  const page = await response.text();
  const slow = byName(page, "slow");
  assert.ok(await logged(slow?.attributes["data-failed"], "consumer"));
  assert.match(slow?.inner ?? "", /<p class="stand-in">late<\/p>/);
  assert.ok(!page.includes("too late to be shown"));
  assert.match(byName(page, "card")?.inner ?? "", /rendered by the producer/);
});

test("a remote placement declared required fails its page with 503", async () => {
  const response = await get("/strict");
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.ok(!body.includes("rendered by the producer") && !body.includes("secret detail"));
  assert.ok(await logged(JSON.parse(body).error.correlationId, "consumer"));
});
