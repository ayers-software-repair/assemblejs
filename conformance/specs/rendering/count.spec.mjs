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
import { get, saidOf, treeOf } from "../http.mjs";

// The default, which a project has no way to move yet.
const LIMIT = 256;
const ONE = '<assembly name="plain"/>';
// What that assembly renders: a child that was placed and answered holds it, a refused one none.
const RENDERED = '<p class="plain">plain html, as written</p>';
const times = (text, part) => text.split(part).length - 1;
const sent = (count) => `?note=${encodeURIComponent(ONE.repeat(count))}`;
const failed = (envelope) => envelope.attributes["data-failed"] !== undefined;

test("at the limit a request places every assembly it is asked to", async () => {
  const answer = await (await get(`/assembly/raw-ejs/${sent(LIMIT)}`)).text();
  const [parent] = treeOf(answer);
  assert.equal(parent.children.length, LIMIT);
  assert.equal(parent.children.filter(failed).length, 0);
  assert.equal(times(answer, RENDERED), LIMIT);
});

test("past it, the ones a template writes last are refused before they render, each with the reason", async () => {
  const answer = await (await get(`/assembly/raw-ejs/${sent(LIMIT + 4)}`)).text();
  const [parent] = treeOf(answer);
  assert.equal(parent.attributes["data-failed"], undefined, "the view that asked still answers");
  assert.equal(times(answer, RENDERED), LIMIT);
  assert.deepEqual(parent.children.map(failed), [
    ...Array(LIMIT).fill(false),
    ...Array(4).fill(true),
  ]);
  for (const refused of parent.children.slice(LIMIT)) {
    assert.match(
      (await saidOf(refused.attributes["data-failed"])) ?? "",
      /^assembly "plain" inside "raw-ejs" was answered by the fallback after too-many$/,
    );
  }
});

test("a page and every view composed for it are one request, and place no more than the limit together", async () => {
  // Five views on the page, each writing the visitor's value raw, each asked for the limit.
  const page = await (await get(`/raw${sent(LIMIT)}`)).text();
  const parents = treeOf(page);
  assert.equal(parents.length, 5);
  assert.equal(parents.filter(failed).length, 0);
  assert.equal(times(page, RENDERED), LIMIT - parents.length);
});
