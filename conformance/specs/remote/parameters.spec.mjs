// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 2.1 and 3.1: a page's route parameters reach an assembly on another server the same way
// they reach a local one, as the assembly-params header the composer sends with the rest of the
// composition state.
import assert from "node:assert/strict";
import { test } from "node:test";
import { envelopesOf, get, originOf } from "../http.mjs";

test("a page's parameter reaches the service of an assembly placed from another server", async () => {
  const response = await get("/goods/z-9");
  assert.equal(response.status, 200);
  const [tag] = envelopesOf(await response.text());
  assert.equal(tag?.attributes["data-remote"], originOf("producer"));
  assert.match(tag?.inner ?? "", /<p class="tag">z-9<\/p>/);
});
