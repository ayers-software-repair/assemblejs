// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// KNOWN FAULT, held here until the owner settles it: docs/studies/placement-and-access.md, and
// the security row of the second reading in docs/TODO.md. The cases marked so below are green
// while the hole is open. They hold what the server does today, so that it cannot change
// unseen, and their green says nothing is sound.
//
// DESIGN 5.2 and 7, together. One decision admits a request by the address it asked, and what
// that address places and renders with its answer is composed in this process and is not asked
// again. So a view that writes a visitor's value raw places, for anyone its page is open to, an
// assembly whose own address refuses them.
import assert from "node:assert/strict";
import { test } from "node:test";
import { originOf, treeOf } from "../http.mjs";

const guarded = originOf("guarded");
const at = (path) => fetch(new URL(path, guarded));
const nameOf = (envelope) => envelope.attributes["data-name"];
const LEDGER = '<assembly name="ledger"></assembly>';
// Two open pages, each holding one view that writes what a visitor sent raw, one in EJS and one
// in Pug. Both are read for what they place and recorded as placing nothing: the fault needs no
// view to go unread.
const BOARDS = { board: "EJS, <%- %>", pinboard: "Pug, !{ }" };

test("an assembly no open page places is refused at its own address, and is on no open page", async () => {
  assert.equal((await at("/assembly/ledger/")).status, 401);
  for (const board of Object.keys(BOARDS)) {
    const open = await at(`/public/${board}`);
    assert.equal(open.status, 200, board);
    const page = await open.text();
    assert.deepEqual(treeOf(page).map(nameOf), [board]);
    assert.deepEqual(treeOf(page)[0].children, [], board);
    assert.ok(!page.includes("kept for members"), board);
  }
});

for (const [board, form] of Object.entries(BOARDS)) {
  test(`KNOWN FAULT: a visitor with no credentials is shown that assembly, on an open page whose view writes the visitor's value raw (${form})`, async () => {
    const placed = await at(`/public/${board}?note=${encodeURIComponent(LEDGER)}`);
    assert.equal(placed.status, 200);
    const page = await placed.text();
    const [parent] = treeOf(page);
    assert.deepEqual(parent.children.map(nameOf), ["ledger"]);
    assert.equal(parent.children[0].attributes["data-failed"], undefined);
    assert.match(page, /the ledger, kept for members/);
  });
}
