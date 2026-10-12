// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.2 across servers: a remote placement that declares a lifetime is answered from the
// cache within it, and one that declares none is fetched for every page.
import assert from "node:assert/strict";
import { test } from "node:test";
import { envelopesOf, get } from "../http.mjs";

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

test("a cached placement is fetched again once its lifetime has passed", async () => {
  const first = await tally("/brief");
  assert.equal(await tally("/brief"), first, "within its lifetime");
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.ok((await tally("/brief")) > first, "past it");
});

// An answer is kept with the ids its first composition minted. The browser mounts an id once,
// so a second placement answered with the same kept answer was left as markup.
test("a placement answered as kept is an instance of its own, with an id no other has", async () => {
  const tallies = async () =>
    envelopesOf(await (await get("/twice")).text()).filter(
      (found) => found.attributes["data-name"] === "tally",
    );
  await tallies();
  const kept = [...(await tallies()), ...(await tallies())];
  assert.equal(kept.length, 4);
  const ids = kept.map((found) => found.attributes["data-id"]);
  assert.equal(new Set(ids).size, 4, `the ids of four kept placements: ${ids.join(", ")}`);
  for (const found of kept) {
    const id = found.attributes["data-id"];
    assert.ok(found.inner.includes(`data-assembly="${id}"`), `no island of its own: ${id}`);
  }
});
