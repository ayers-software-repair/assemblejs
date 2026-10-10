// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 7: the composer reads the markup a view rendered. A value a view escapes is text and
// places nothing. A value it writes raw is markup like the rest, and a directive in it is a
// placement like any its author wrote: nothing between a view and the composer tells the two
// apart. Each parent here writes what a visitor sent twice, escaped and raw, and its source
// names no child at all.
//
// Whether a render should place such a directive at all is the owner's to settle
// (docs/studies/placement-and-access.md). Until then this holds what happens, so that it cannot
// change unseen; ../trust/raw.spec.mjs holds what it lets a visitor reach.
import assert from "node:assert/strict";
import { test } from "node:test";
import { get, logged, treeOf } from "../http.mjs";

const PLACED = '<assembly name="plain"></assembly>';
// What that assembly renders: a child that was placed and answered holds it, a refused one none.
const RENDERED = '<p class="plain">plain html, as written</p>';
const times = (text, part) => text.split(part).length - 1;
// How each kind of view writes a value raw.
const PARENTS = {
  "raw-ejs": "<%- %>",
  "raw-handlebars": "{{{ }}}",
  "raw-nunjucks": "| safe",
  "raw-pug": "!{ }",
  "raw-svelte": "{@html}",
};
const nameOf = (envelope) => envelope.attributes["data-name"];
const sent = (note) => `?note=${encodeURIComponent(note)}`;
const asked = (parent, note) => get(`/assembly/${parent}/${sent(note)}`);

for (const [parent, form] of Object.entries(PARENTS)) {
  test(`${parent}: a directive a visitor sent is text where the view escapes it, and a placement where it writes it with ${form}`, async () => {
    const response = await asked(parent, PLACED);
    assert.equal(response.status, 200);
    const answer = await response.text();
    const [envelope, ...others] = treeOf(answer);
    assert.equal(nameOf(envelope), parent);
    assert.equal(others.length, 0);
    // One child, from the raw form alone: the escaped copy is still the visitor's text.
    assert.deepEqual(envelope.children.map(nameOf), ["plain"]);
    assert.equal(envelope.children[0].attributes["data-failed"], undefined);
    assert.equal(times(answer, RENDERED), 1);
    assert.match(answer, /class="quoted">&lt;assembly name(=|&#x3D;)(&quot;|&#34;|")plain/);
    assert.ok(!/<assembly[\s>]/i.test(answer), "the directive itself is never emitted");
  });

  test(`${parent}: a value with no directive in it places nothing`, async () => {
    const [envelope] = treeOf(await (await asked(parent, "<b>bold</b>")).text());
    assert.deepEqual(envelope.children, []);
  });
}

test("on a page, what a visitor puts in its address is placed by every view that writes it raw", async () => {
  const asWritten = await (await get("/raw")).text();
  const written = treeOf(asWritten);
  assert.deepEqual(written.map(nameOf), Object.keys(PARENTS));
  for (const parent of written) assert.deepEqual(parent.children, [], nameOf(parent));
  assert.equal(times(asWritten, RENDERED), 0);

  const response = await get(`/raw${sent(PLACED)}`);
  assert.equal(response.status, 200);
  const page = await response.text();
  const parents = treeOf(page);
  assert.deepEqual(parents.map(nameOf), Object.keys(PARENTS));
  for (const parent of parents) {
    assert.deepEqual(parent.children.map(nameOf), ["plain"], nameOf(parent));
    assert.equal(parent.attributes["data-failed"], undefined, nameOf(parent));
    assert.equal(parent.children[0].attributes["data-failed"], undefined, nameOf(parent));
  }
  assert.equal(times(page, RENDERED), parents.length);
  assert.ok(!/<assembly[\s>]/i.test(page), "the directive itself is never emitted");
});

test("a name a visitor sent that no assembly has is a placement that fails, inside a parent that answered", async () => {
  const response = await asked("raw-ejs", '<assembly name="no-such-assembly"></assembly>');
  assert.equal(response.status, 200);
  const [envelope] = treeOf(await response.text());
  assert.equal(envelope.attributes["data-failed"], undefined);
  assert.deepEqual(envelope.children.map(nameOf), ["no-such-assembly"]);
  assert.notEqual(envelope.children[0].attributes["data-failed"], undefined);
});

test("a directive the finder refuses, sent by a visitor, fails the view that wrote it raw", async () => {
  // An opening tag alone. At the assembly's own address the failure is the answer.
  const response = await asked("raw-ejs", '<assembly name="plain">');
  assert.equal(response.status, 500);
  const [envelope] = treeOf(await response.text());
  assert.equal(nameOf(envelope), "raw-ejs");
  assert.deepEqual(envelope.children, []);
  assert.equal(await logged(envelope.attributes["data-failed"]), true);

  // On a page it is that view's failed envelope, and its siblings fail with it only because
  // each of them wrote the same value raw.
  const page = await get(`/raw${sent('<assembly name="plain">')}`);
  assert.equal(page.status, 200);
  for (const parent of treeOf(await page.text())) {
    assert.notEqual(parent.attributes["data-failed"], undefined, nameOf(parent));
    assert.deepEqual(parent.children, [], nameOf(parent));
  }
});
