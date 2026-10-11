// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 5.2 and 7, together: an assembly is guarded wherever it is placed, by the rule that
// guards its own address. A view that writes a visitor's value raw places what the value names
// (7), and the visitor is shown it only where the assembly's own address would admit them: the
// decision is made again at each placement, before anything renders and before any cache. The
// owner's ruling of 2026-10-10, way A of docs/studies/placement-and-access.md.
import assert from "node:assert/strict";
import { test } from "node:test";
import { originOf, treeOf } from "../http.mjs";

const guarded = originOf("guarded");
const at = (path, init = {}) => fetch(new URL(path, guarded), init);
const credentials = `Basic ${Buffer.from("lovelace:open-sesame").toString("base64")}`;
const signed = (path) => at(path, { headers: { authorization: credentials } });
const nameOf = (envelope) => envelope.attributes["data-name"];
const LEDGER = '<assembly name="ledger"></assembly>';
// Two open pages, each holding one view that writes what a visitor sent raw, one in EJS and one
// in Pug. Both are read for what they place and recorded as placing nothing: the rule needs no
// view to be read.
const BOARDS = { board: "EJS, <%- %>", pinboard: "Pug, !{ }" };

test("an assembly no open page places is refused at its own address, and is on no open page", async () => {
  assert.equal((await at("/assembly/ledger/")).status, 401);
  for (const board of Object.keys(BOARDS)) {
    const open = await at(`/public/${board}`);
    assert.equal(open.status, 200, board);
    const page = await open.text();
    assert.deepEqual(treeOf(page).map(nameOf), [board]);
    assert.equal(treeOf(page)[0].attributes["data-failed"], undefined, `${board} is open`);
    assert.deepEqual(treeOf(page)[0].children, [], board);
    assert.ok(!page.includes("kept for members"), board);
  }
});

for (const [board, form] of Object.entries(BOARDS)) {
  test(`a visitor with no credentials is not shown that assembly, though the visitor's own value names it on an open page whose view writes it raw (${form})`, async () => {
    const asked = await at(`/public/${board}?note=${encodeURIComponent(LEDGER)}`);
    assert.equal(asked.status, 200, "the open page still answers");
    const page = await asked.text();
    assert.ok(!page.includes("the ledger, kept for members"), "the ledger's words are in the page");
    // Whatever stands where the directive stood, it is not the ledger, answered.
    const [parent] = treeOf(page);
    assert.equal(parent.attributes["data-failed"], undefined, `${board} itself did not answer`);
    for (const child of parent.children) {
      assert.notEqual(child.attributes["data-failed"], undefined, `${nameOf(child)} answered`);
    }
  });

  test(`refused, it stands as an empty envelope marked failed with no id, and nothing is logged for it (${form})`, async () => {
    const page = await (await at(`/public/${board}?note=${encodeURIComponent(LEDGER)}`)).text();
    const [parent] = treeOf(page);
    assert.deepEqual(parent.children.map(nameOf), ["ledger"]);
    assert.equal(parent.children[0].attributes["data-failed"], "", "no failure, so no id to find");
    assert.deepEqual(parent.children[0].children, []);
  });

  test(`a visitor with credentials is shown it there, as at its own address (${form})`, async () => {
    const page = await (await signed(`/public/${board}?note=${encodeURIComponent(LEDGER)}`)).text();
    const [parent] = treeOf(page);
    assert.deepEqual(parent.children.map(nameOf), ["ledger"]);
    assert.equal(parent.children[0].attributes["data-failed"], undefined);
    assert.match(page, /the ledger, kept for members/);
  });
}

test("at an assembly's own open address, what its view places of a guarded assembly is decided the same way", async () => {
  const guest = await at(`/assembly/board/?note=${encodeURIComponent(LEDGER)}`);
  assert.equal(guest.status, 200, "the board's address is open");
  const shown = await guest.text();
  assert.ok(!shown.includes("kept for members"), "the ledger's words are in the answer");
  const [board] = treeOf(shown);
  assert.deepEqual(board.children.map(nameOf), ["ledger"]);
  assert.equal(board.children[0].attributes["data-failed"], "");
  const member = await (await signed(`/assembly/board/?note=${encodeURIComponent(LEDGER)}`)).text();
  assert.match(member, /the ledger, kept for members/);
});

test("a deferred placement of a guarded assembly is left to its own address, which refuses the visitor there", async () => {
  const open = await at("/public/later");
  assert.equal(open.status, 200);
  const page = await open.text();
  const ledger = treeOf(page).find((envelope) => nameOf(envelope) === "ledger");
  assert.notEqual(ledger, undefined, "the ledger's placeholder is on the page");
  assert.equal(ledger.attributes["data-defer"], "", "deferred, not decided with the page");
  assert.equal(ledger.attributes["data-failed"], undefined);
  assert.ok(!page.includes("kept for members"));
  // The browser's fill is a request to the address, decided as every request is.
  assert.equal((await at("/assembly/ledger/default/")).status, 401);
  assert.equal((await signed("/assembly/ledger/default/")).status, 200);
});
