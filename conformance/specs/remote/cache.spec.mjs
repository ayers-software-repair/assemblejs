// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.2 across servers: a remote placement that declares a lifetime is answered from the
// cache within it, and one that declares none is fetched for every page.
import assert from "node:assert/strict";
import { test } from "node:test";
import { get } from "../http.mjs";

const tally = async (path) => {
  const page = await (await get(path)).text();
  const found = /<p class="tally">(\d+)<\/p>/.exec(page);
  assert.ok(found !== null, `no tally on ${path}`);
  return Number(found[1]);
};

test("a placement with a lifetime is not fetched again within it", async () => {
  const first = await tally("/cached");
  assert.equal(await tally("/cached"), first);
});

test("a placement without one is fetched for every page", async () => {
  const first = await tally("/fresh");
  assert.ok((await tally("/fresh")) > first);
});
