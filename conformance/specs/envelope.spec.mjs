// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 2.4: the envelope.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attributesOf, get, islandOf } from "./contract.mjs";

const CANONICAL = ["data-id", "data-name", "data-renderer", "data-view"];
const WHEN_THEY_APPLY = ["data-defer", "data-failed", "data-mount", "data-remote"];

test("carries the canonical attribute set, and only the ones that apply besides", async () => {
  for (const name of ["cart", "failing"]) {
    const attributes = attributesOf(await (await get(`/assembly/${name}/`)).text());
    for (const required of CANONICAL) assert.ok(required in attributes, `${name}: ${required}`);
    for (const attribute of Object.keys(attributes)) {
      assert.ok([...CANONICAL, ...WHEN_THEY_APPLY].includes(attribute), `${name}: ${attribute}`);
    }
    assert.equal(attributes["data-name"], name);
  }
});

test("holds its data island inside, addressed by its id, its data unable to end the script", async () => {
  const body = await (await get("/assembly/cart/")).text();
  const island = islandOf(body);
  assert.equal(island.id, attributesOf(body)["data-id"]);
  assert.equal(island.payload.data.note, "</script><b>bold</b>");
  assert.equal(body.match(/<\/script>/g)?.length, 1, "only the island's own end tag");
});

test("is what a page places, in the page", async () => {
  const page = await (await get("/")).text();
  assert.match(page, /<assembly-root\b[^>]*data-name="cart"/);
  assert.ok(!page.includes("<assembly "), "the template's directive is never emitted");
});
