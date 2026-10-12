// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { posix } from "node:path";
import { test } from "node:test";
import { Window } from "happy-dom";
import { JSX } from "typedoc";
import { load } from "./site-api-theme.mjs";
import { pageText } from "./site-page-text.mjs";
import { renderLinks, sharedLinksMatch } from "./site-links.mjs";

test("illustrated procedures retain instructions, ordered steps, captions and links as text", () => {
  const page = pageText(
    `<main><aside><nav>Repeated chapters</nav></aside><article>
    <p class="manual-location">Repeated breadcrumb</p><h1>Install</h1><p>Make an application.</p>
    <ol><li><strong>Create it.</strong><p>Run <code>npm create</code>.</p></li>
    <li>Open <a href="../start.html">the application</a>.</li></ol>
    <figure><img src="result.png" alt="Result"><figcaption>The generated page is open.</figcaption></figure>
    <p><a href="../downloads.html"><b>Downloads</b><span aria-hidden="true">Decoration</span></a></p>
    </article></main>`,
    "docs/install.html",
  );
  const text = page.blocks.join("\n\n");
  assert.equal(page.title, "Install");
  assert.equal(page.lede, "Make an application.");
  assert.match(text, /1\. Create it\./);
  assert.match(text, /Run `npm create`/);
  assert.match(text, /2\. Open \[the application\]\(start.html\)/);
  assert.match(text, /The generated page is open\./);
  assert.match(text, /\[Downloads\]\(downloads.html\)/);
  assert.doesNotMatch(text, /Repeated|Decoration/);
});

test("new unsupported content still fails rather than disappearing from the text export", () => {
  assert.throws(
    () => pageText("<main><h1>A</h1><p>B.</p><canvas>Unknown</canvas></main>", "a.html"),
    /canvas.*no way/,
  );
});

test("heading groups keep the strapline without mistaking it for the page description", () => {
  const page = pageText(
    "<main><hgroup><h1>Framework</h1><p>The strapline.</p></hgroup><p>The description.</p><ul><li>A feature.</li></ul></main>",
    "index.html",
  );
  assert.equal(page.title, "Framework");
  assert.equal(page.lede, "The description.");
  assert.deepEqual(page.blocks, [
    "# Framework",
    "The strapline.",
    "The description.",
    "- A feature.",
  ]);
});

test("404 recovery links keep the product prefix at an unknown nested address", () => {
  const html = readFileSync(new URL("../site/404.html", import.meta.url), "utf8");
  for (const host of ["https://assemblejs.com", "https://ayers.repair"]) {
    const window = new Window({ url: host + "/assemblejs/missing/deep/page.html" });
    try {
      window.document.write(html);
      assert.equal(window.document.querySelector("base"), null);
      const address = (selector) => window.document.querySelector(selector).href;
      assert.equal(address(".product-brand"), host + "/assemblejs/index.html");
      assert.equal(address(".product-nav a"), host + "/assemblejs/downloads.html");
      assert.equal(address('link[rel="stylesheet"]'), host + "/assemblejs/skin.css");
      assert.equal(address(".product-skip"), window.location.href + "#main");
    } finally {
      void window.happyDOM.close();
    }
  }
});

test("product navigation resolves correctly for nested guides and marks the active section", () => {
  const manifest = {
    navigation: [
      { url: "downloads.html", title: "Downloads", section: "downloads" },
      { url: "docs/index.html", title: "Documentation", section: "docs" },
      { url: "support.html", title: "Support", section: "support" },
    ],
  };
  assert.equal(
    renderLinks(manifest, { file: "docs/tutorial.html" }),
    '<a href="../downloads.html">Downloads</a><a href="index.html" aria-current="page">Documentation</a><a href="../support.html">Support</a>',
  );
  assert.match(
    renderLinks(manifest, { file: "support.html" }),
    /href="support.html" aria-current="page"/,
  );
  assert.doesNotMatch(renderLinks(manifest, { file: "404.html" }), /aria-current/);
});

test("generated navigation accepts equivalent paths and refuses missing or incorrect links", () => {
  const links = '<a href="index.html" aria-current="page">Documentation</a>';
  assert.equal(
    sharedLinksMatch(
      '<nav class="product-nav"><a href="../docs/index.html" aria-current="page">Documentation</a></nav>',
      links,
      "docs/start.html",
    ),
    true,
  );
  assert.equal(
    sharedLinksMatch(
      '<nav class="product-nav"><a href="missing.html">Documentation</a></nav>',
      links,
      "docs/start.html",
    ),
    false,
  );
  assert.equal(sharedLinksMatch("<nav></nav>", links, "docs/start.html"), false);
});

test("TypeDoc keeps the real product header and active navigation at every reference depth", () => {
  const hooks = new Map();
  load({ renderer: { hooks: { on: (name, hook) => hooks.set(name, hook) }, on() {} } });
  const manifest = JSON.parse(readFileSync(new URL("../site/pages.json", import.meta.url), "utf8"));
  for (const file of ["index.html", "classes/Assembly.html"]) {
    const html = JSX.renderElement(
      hooks.get("body.begin")({
        page: { url: file },
        relativeURL: (path) => posix.relative(posix.dirname(file), path),
      }),
    );
    assert.match(html, /<header class="product-header">/);
    assert.doesNotMatch(html, /undefined/);
    assert.ok(
      sharedLinksMatch(
        html,
        renderLinks(manifest, { file: `docs/api/${file}` }),
        `docs/api/${file}`,
      ),
    );
    assert.match(html, /href="#tsd-content"/);
  }
});
