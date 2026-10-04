// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 7 through the contract of DESIGN 2: every renderer AssembleJS ships, installed from its
// tarball, answers the same three endpoints with the same envelope, and escapes what it is given.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attributesOf, get, islandOf } from "../http.mjs";

const FRAMEWORKS = ["react", "preact", "solid", "svelte", "vue", "lit"];
const ENGINES = ["ejs", "handlebars", "nunjucks", "pug"];

/** Every assembly the fixture declares, the renderer its file names, and what it must render. */
const VIEWS = [
  { name: "plain", renderer: "html", markup: /<p class="plain">plain html, as written<\/p>/ },
  {
    name: "notes",
    renderer: "markdown",
    markup: /<h1>Notes<\/h1>[\s\S]*<em>emphasis<\/em>[\s\S]*&lt;b&gt;raw markup&lt;\/b&gt;/,
  },
  ...ENGINES.map((engine) => ({
    name: `${engine}-card`,
    renderer: engine,
    markup: new RegExp(
      `data-engine="${engine}"[\\s\\S]*<h2>&lt;em&gt;${engine}&lt;/em&gt;</h2>[\\s\\S]*<li>one</li>[\\s\\S]*<li>two</li>`,
    ),
  })),
  ...FRAMEWORKS.map((framework) => ({
    name: `${framework}-label`,
    renderer: framework,
    markup: new RegExp(
      // Text needs only its "<" escaped for no element to start; ">" may stay as written.
      `data-framework="${framework}"[^>]*>(<!--[^>]*-->|\\s)*&lt;b(>|&gt;)${framework}&lt;/b(>|&gt;)`,
    ),
  })),
];

for (const view of VIEWS) {
  test(`${view.name}: one envelope naming the ${view.renderer} renderer, its markup inside`, async () => {
    const response = await get(`/assembly/${view.name}/`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
    const body = (await response.text()).trim();
    assert.equal(body.match(/<assembly-root\b/g)?.length, 1, body);
    const attributes = attributesOf(body);
    assert.equal(attributes["data-name"], view.name);
    assert.equal(attributes["data-renderer"], view.renderer);
    assert.equal(attributes["data-failed"], undefined, body);
    assert.match(body, view.markup);
  });

  test(`${view.name}: the data endpoint answers the island's object, and nothing raw escapes`, async () => {
    const body = await (await get(`/assembly/${view.name}/`)).text();
    const data = await (await get(`/assembly/${view.name}/default/api/`)).json();
    assert.deepEqual(data, islandOf(body).payload.data);
    for (const value of Object.values(data)) {
      if (typeof value === "string" && value.includes("<")) {
        const outside = body.replace(/<script type="application\/json"[\s\S]*?<\/script>/, "");
        assert.ok(!outside.includes(value), `${value} reached the markup unescaped`);
      }
    }
  });

  test(`${view.name}: the manifest names the ${view.renderer} renderer`, async () => {
    const response = await get(`/assembly/${view.name}/default/manifest/`);
    assert.equal(response.status, 200);
    const manifest = await response.json();
    assert.equal(manifest.renderer, view.renderer);
    assert.equal(manifest.name, view.name);
  });
}
