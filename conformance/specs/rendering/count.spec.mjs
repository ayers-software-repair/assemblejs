// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.4: one request places no more assemblies than the server's limit, at every depth
// together. The one past it is refused before anything is dispatched for it, as a loop is, so
// a request cannot be made to render without end. A view that writes a visitor's value raw is
// how a request is made to ask for more than its author wrote, and what is asked through here.
//
// Asserted is what holds for every run of a request. Which placements are refused, across
// views composed at once, is the order they finished rendering, and no case here names it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { get, loggedLines, saidOf, treeOf } from "../http.mjs";

// The default, which a project has no way to move yet.
const LIMIT = 256;
const ONE = '<assembly name="plain"/>';
// What that assembly renders: a child that was placed and answered holds it, a refused one none.
const RENDERED = '<p class="plain">plain html, as written</p>';
const times = (text, part) => text.split(part).length - 1;
const sent = (count) => `?note=${encodeURIComponent(ONE.repeat(count))}`;
const failed = (envelope) => envelope.attributes["data-failed"] !== undefined;
const nameOf = (envelope) => envelope.attributes["data-name"];

test("at the limit a request places every assembly it is asked to", async () => {
  const answer = await (await get(`/assembly/raw-ejs/${sent(LIMIT)}`)).text();
  const [parent] = treeOf(answer);
  assert.equal(parent.children.length, LIMIT);
  assert.equal(parent.children.filter(failed).length, 0);
  assert.equal(times(answer, RENDERED), LIMIT);
});

test("past it, the ones a template writes last are refused before they render, under one id and one line", async () => {
  const answer = await (await get(`/assembly/raw-ejs/${sent(LIMIT + 4)}`)).text();
  const [parent] = treeOf(answer);
  assert.equal(parent.attributes["data-failed"], undefined, "the view that asked still answers");
  assert.equal(times(answer, RENDERED), LIMIT);
  assert.deepEqual(parent.children.map(failed), [
    ...Array(LIMIT).fill(false),
    ...Array(4).fill(true),
  ]);
  // Every one refused so carries the one id, and the log has one line against it, for all four.
  const ids = new Set(parent.children.slice(LIMIT).map((one) => one.attributes["data-failed"]));
  assert.equal(ids.size, 1);
  const [id] = ids;
  const lines = await loggedLines((written) => written.correlationId === id);
  assert.deepEqual(
    lines.map((line) => line.message),
    ['4 placements inside "raw-ejs" were refused after too-many, the first of them "plain"'],
  );
});

test("a page and every view composed for it are one request, and place no more than the limit together", async () => {
  // Five views on the page, each writing the visitor's value raw, each asked for the limit.
  const page = await (await get(`/raw${sent(LIMIT)}`)).text();
  const parents = treeOf(page);
  assert.equal(parents.length, 5);
  assert.equal(parents.filter(failed).length, 0);
  assert.equal(times(page, RENDERED), LIMIT - parents.length);
});

// What a flood costs. A stored value names an assembly ten thousand times, and its view writes
// it raw: no more than the limit render, the rest are one line in the log, and the answer is
// under the limit on bytes or is refused by it, whoever asked.
const FLOOD =
  /^(\d+) placements inside "flooded" were refused after too-many, the first of them "plain"$/;
const floods = () => loggedLines((written) => FLOOD.test(String(written.message)), 0);

test("ten thousand directives in one stored value are one line in the log, and an answer its own address refuses for its size", async () => {
  const before = (await floods()).length;
  const response = await get("/assembly/flooded/");
  // 256 placed and 9744 empty envelopes are more than the limit on bytes.
  assert.equal(response.status, 500);
  const answer = await response.text();
  assert.ok(answer.length < 4096, `the refusal is ${answer.length} bytes`);
  const [refused] = treeOf(answer);
  assert.equal(nameOf(refused), "flooded");
  assert.match(
    (await saidOf(refused.attributes["data-failed"])) ?? "",
    /assembly "flooded" answered more than 2097152 bytes/,
  );
  const lines = await loggedLines((written) => FLOOD.test(String(written.message)), before + 1);
  assert.equal(lines.length, before + 1, "one line for the ten thousand");
  assert.equal(FLOOD.exec(lines.at(-1).message)[1], String(10_000 - LIMIT));
});

test("placed on a page, that answer is refused by the limit on bytes, and the page stays small", async () => {
  // The page's request is the one counted here, so its one line says so, and its own
  // placement of the view is the first of the 256.
  const ON_PAGE =
    /^(\d+) placements on page "\/flooded" were refused after too-many, the first of them "plain"$/;
  const accounts = (atLeast) =>
    loggedLines((written) => ON_PAGE.test(String(written.message)), atLeast);
  const before = (await accounts(0)).length;
  const response = await get("/flooded");
  assert.equal(response.status, 200);
  const page = await response.text();
  assert.ok(page.length < 4096, `the page is ${page.length} bytes`);
  const [parent, ...others] = treeOf(page);
  assert.deepEqual(others, []);
  assert.equal(nameOf(parent), "flooded");
  assert.deepEqual(parent.children, []);
  assert.match(
    (await saidOf(parent.attributes["data-failed"])) ?? "",
    /^assembly "flooded" on page "\/flooded" was answered by the fallback after too-large$/,
  );
  const lines = await accounts(before + 1);
  assert.equal(lines.length, before + 1, "one line for all that the page's request refused");
  assert.equal(ON_PAGE.exec(lines.at(-1).message)[1], String(10_001 - LIMIT));
});
