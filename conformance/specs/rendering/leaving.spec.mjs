// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.3 and 3.4: a request whose asker has left composes nothing further. A child whose
// service takes its time places a grandchild; for an asker who waits it is composed, and for one
// who left before the service answered it is refused before dispatch, `aborted`, and the request
// accounts for every placement refused so once, under one id and one line.
import assert from "node:assert/strict";
import { test } from "node:test";
import { get, loggedLines, origin, treeOf } from "../http.mjs";

const RENDERED = '<p class="plain">plain html, as written</p>';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("an asker who waits is answered the grandchild; one who left has nothing composed for them, said once", async () => {
  const waited = await get("/tardy");
  assert.equal(waited.status, 200);
  const page = await waited.text();
  assert.match(page, new RegExp(RENDERED));
  assert.deepEqual(
    treeOf(page)[0].children.map((child) => child.attributes["data-name"]),
    ["plain"],
  );

  const leaving = new AbortController();
  const left = fetch(new URL("/tardy", origin), { signal: leaving.signal }).catch(
    (error) => error.name,
  );
  await sleep(50);
  leaving.abort();
  assert.equal(await left, "AbortError");
  // Written once the child's service has answered, which the other specs' load may delay.
  const lines = await loggedLines(
    (line) => String(line.message).includes('on page "/tardy" were refused after aborted'),
    1,
    undefined,
    150,
  );
  assert.equal(lines.length, 1, "one line a request, not one a placement");
  assert.match(
    lines[0].message,
    /^1 placements on page "\/tardy" were refused after aborted, the first of them "plain"$/,
  );
});
