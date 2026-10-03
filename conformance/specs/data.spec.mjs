// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 2.2: the data endpoint.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attributesOf, get, islandOf } from "./contract.mjs";

test("answers exactly the object the content endpoint put in the island", async () => {
  const response = await get("/assembly/cart/default/api/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
  const island = islandOf(await (await get("/assembly/cart/")).text());
  assert.deepEqual(await response.json(), island.payload.data);
});

test("answers a service that throws with 500 and an id, never partial data or the cause", async () => {
  const response = await get("/assembly/failing/default/api/");
  assert.equal(response.status, 500);
  const body = await response.text();
  assert.ok(!body.includes("secret"), "the cause never reaches a body");
  assert.match(JSON.parse(body).error.correlationId, /\S+/);
});

test("renders a fallback from the content endpoint for the same throw, marked with an id", async () => {
  const response = await get("/assembly/failing/");
  const body = await response.text();
  assert.ok(!body.includes("never shown") && !body.includes("secret"));
  assert.match(attributesOf(body)["data-failed"] ?? "", /\S+/);
});
