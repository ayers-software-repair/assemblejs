// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 2.3: the manifest.
import assert from "node:assert/strict";
import { test } from "node:test";
import { get } from "../http.mjs";

test("answers the named fields and nothing else", async () => {
  const response = await get("/assembly/cart/default/manifest/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
  const manifest = await response.json();
  assert.deepEqual(Object.keys(manifest).sort(), [
    "assets",
    "contract",
    "name",
    "public",
    "renderer",
    "version",
    "view",
    "views",
  ]);
  assert.equal(manifest.contract, 1);
  assert.equal(manifest.name, "cart");
  assert.equal(manifest.view, "default");
  assert.deepEqual(manifest.views, ["default"]);
  assert.equal(manifest.renderer, "html");
  assert.ok(Array.isArray(manifest.assets.css) && Array.isArray(manifest.assets.js));
  assert.equal(typeof manifest.public, "boolean");
});

test("carries the version the content endpoint reports", async () => {
  const manifest = await (await get("/assembly/cart/default/manifest/")).json();
  const content = await get("/assembly/cart/");
  assert.equal(manifest.version, content.headers.get("assembly-version"));
});
