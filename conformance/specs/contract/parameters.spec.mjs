// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 2.1 and 8: a page's route parameters reach the services of the assemblies it places,
// and a parent sends them to a fragment as the assembly-params header, which the content and
// data endpoints read and, malformed, refuse like every other composition header.
import assert from "node:assert/strict";
import { test } from "node:test";
import { get, islandOf } from "../http.mjs";

test("a page hands its route's parameters to the assemblies it places", async () => {
  const response = await get("/items/a-1");
  assert.equal(response.status, 200);
  const island = islandOf(await response.text());
  assert.deepEqual(island.payload.data, { sku: "a-1", given: ["sku"] });
});

test("the content endpoint reads the parameters a parent sends, and none without them", async () => {
  const sent = islandOf(
    await (await get("/assembly/echo/", { "assembly-params": "sku=b+2" })).text(),
  );
  assert.deepEqual(sent.payload.data, { sku: "b 2", given: ["sku"] });
  const bare = islandOf(await (await get("/assembly/echo/")).text());
  assert.deepEqual(bare.payload.data, { sku: "none", given: [] });
});

test("the data endpoint reads them too, so the data is what the content was rendered from", async () => {
  const data = await (
    await get("/assembly/echo/default/api/", { "assembly-params": "sku=c3&extra=1" })
  ).json();
  assert.deepEqual(data, { sku: "c3", given: ["extra", "sku"] });
});

test("refuses the parameters malformed with 400, on content and on data, naming the header", async () => {
  for (const raw of ["1x=1", "id=1&id=2", `sku=${"x".repeat(2100)}`]) {
    for (const path of ["/assembly/echo/", "/assembly/echo/default/api/"]) {
      const response = await get(path, { "assembly-params": raw });
      assert.equal(response.status, 400, `${path} ${raw.slice(0, 20)}`);
      assert.match(JSON.stringify(await response.json()), /assembly-params/);
    }
  }
});
