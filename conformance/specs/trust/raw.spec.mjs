// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
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

test("an assembly no open page places is refused at its own address, and is on no open page", async () => {
  assert.equal((await at("/assembly/ledger/")).status, 401);
  const open = await at("/public/board");
  assert.equal(open.status, 200);
  const page = await open.text();
  assert.deepEqual(treeOf(page).map(nameOf), ["board"]);
  assert.deepEqual(treeOf(page)[0].children, []);
  assert.ok(!page.includes("kept for members"));
});

test("a view that writes a visitor's value raw places it on an open page, with no credentials asked", async () => {
  const placed = await at(`/public/board?note=${encodeURIComponent(LEDGER)}`);
  assert.equal(placed.status, 200);
  const page = await placed.text();
  const [board] = treeOf(page);
  assert.deepEqual(board.children.map(nameOf), ["ledger"]);
  assert.equal(board.children[0].attributes["data-failed"], undefined);
  assert.match(page, /the ledger, kept for members/);
});
