// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";
import { test } from "node:test";
import { Window } from "happy-dom";
import { JSX } from "typedoc";
import { load } from "./site-api-theme.mjs";
import { pageText } from "./site-page-text.mjs";
import { renderLinks, sharedLinksMatch } from "./site-links.mjs";

test("site deployment follows only site inputs and the platform pin on main and next", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/deploy-site.yml", import.meta.url),
    "utf8",
  );
  const triggers = /^on:\n([\s\S]*?)\n\npermissions:/m.exec(workflow)?.[1];
  assert.ok(triggers, "workflow trigger block");
  const push = /^ {2}push:\n([\s\S]*?)(?=^ {2}workflow_dispatch:)/m.exec(triggers)?.[1];
  assert.ok(push, "push trigger");
  const branches = /^ {4}branches: \[([^\]]+)\]$/m.exec(push)?.[1].split(", ");
  assert.deepEqual(branches, ["main", "next"]);
  assert.doesNotMatch(push, /^ {4}tags:/m);
  const pathBlock = /^ {4}paths:\n((?: {6}- .+\n?)+)/m.exec(push)?.[1] ?? "";
  const paths = [...pathBlock.matchAll(/^ {6}- "([^"]+)"$/gm)].map((match) => match[1]);
  assert.deepEqual(paths, [
    "site/**",
    "site-source/**",
    "package.json",
    ".github/workflows/deploy-site.yml",
  ]);
  assert.doesNotMatch(pathBlock, /(?:^|\/)\*\*(?:\/|$).*packages|packages\/\*\*/);
  assert.match(triggers, /^ {2}workflow_dispatch:$/m);
  assert.match(triggers, /^ {2}workflow_call:$/m);
});

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

test("site staging copies the released kit closure without a retired module", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/deploy-site.yml", import.meta.url),
    "utf8",
  );
  const commands = /^ {6}- name: Stage the kit into the site\n {8}run: \|\n((?: {10}.+\n)+)/m.exec(
    workflow,
  )?.[1];
  assert.ok(commands, "actual kit staging commands");
  const root = mkdtempSync(join(tmpdir(), "assemblejs-kit-staging-"));
  const files = [
    "product.css",
    "install.css",
    "store-badges.css",
    "landing-background.js",
    "landing-worker.js",
    "landing-renderers.js",
    "landing-shaders.js",
    "product-downloads.js",
    "icons/check.svg",
    "badges/app-store.svg",
    "badges/amazon-appstore.png",
  ];
  try {
    mkdirSync(join(root, "site/kit"), { recursive: true });
    writeFileSync(join(root, "site/kit/old.txt"), "old");
    for (const file of files) {
      const path = join(root, "_platform/sitekit", file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, `fixture:${file}`);
    }
    execFileSync("bash", ["-e", "-c", commands], { cwd: root, stdio: "pipe" });
    for (const file of files)
      assert.equal(readFileSync(join(root, "site/kit", file), "utf8"), `fixture:${file}`);
    assert.throws(() => readFileSync(join(root, "site/kit/old.txt")), { code: "ENOENT" });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
