// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { pageText } from "./site-page-text.mjs";
import { renderLinks } from "./site-links.mjs";

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
