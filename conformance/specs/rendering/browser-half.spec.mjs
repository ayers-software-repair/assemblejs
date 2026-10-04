// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 9: a static assembly ships no JavaScript at all, as a mode and not an accident; a
// framework assembly's browser half is named by its manifest and served.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attributesOf, get, origin } from "../http.mjs";

const STATIC = ["plain", "notes", "ejs-card", "handlebars-card", "nunjucks-card", "pug-card"];
const HYDRATED = ["react", "preact", "solid", "svelte", "vue", "lit"].map(
  (name) => `${name}-label`,
);

for (const name of STATIC) {
  test(`${name}: declared never to mount, and its manifest names no script`, async () => {
    const body = await (await get(`/assembly/${name}/`)).text();
    assert.equal(attributesOf(body)["data-mount"], "none");
    const manifest = await (await get(`/assembly/${name}/default/manifest/`)).json();
    assert.deepEqual(manifest.assets.js, []);
  });
}

for (const name of HYDRATED) {
  test(`${name}: mounts on load, and every script its manifest names is served`, async () => {
    const body = await (await get(`/assembly/${name}/`)).text();
    assert.equal(attributesOf(body)["data-mount"], undefined, "load is the default, not emitted");
    const manifest = await (await get(`/assembly/${name}/default/manifest/`)).json();
    assert.ok(manifest.assets.js.length > 0, "a framework view has a browser half");
    for (const script of manifest.assets.js) {
      const response = await fetch(new URL(script, origin));
      assert.equal(response.status, 200, script);
      assert.match(response.headers.get("content-type") ?? "", /javascript/, script);
      assert.ok((await response.text()).length > 0, script);
    }
  });
}

for (const [name, mode] of [
  ["visible-label", "visible"],
  ["idle-label", "idle"],
]) {
  test(`${name}: the envelope carries the mount mode its view declared, ${mode}`, async () => {
    const body = await (await get(`/assembly/${name}/`)).text();
    assert.equal(attributesOf(body)["data-mount"], mode);
  });
}
