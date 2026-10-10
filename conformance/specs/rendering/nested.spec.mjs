// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 2.4, 3.4 and 7: a view places a child as a page does. The child's envelope stands
// inside its parent's, whatever wrote the parent and whatever wrote the child; a child is one
// level deeper than its parent with its parent among its ancestors, and what would be its own
// ancestor, or one level past the cap, is refused before anything is dispatched.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { test } from "node:test";
import { get, logged, rootOf, started, treeOf } from "../http.mjs";

// Each kind of view as a parent, and the child its view places, written in another.
const PLACES = {
  "html-nest": "react-label",
  "ejs-nest": "svelte-label",
  "handlebars-nest": "vue-label",
  "nunjucks-nest": "lit-label",
  "pug-nest": "preact-label",
  "react-nest": "plain",
  "preact-nest": "ejs-card",
  "solid-nest": "react-label",
  "svelte-nest": "solid-label",
  "vue-nest": "svelte-label",
  "lit-nest": "vue-label",
  "shadow-nest": "tinted",
};
const nameOf = (envelope) => envelope.attributes["data-name"];

test("a parent in every kind of view holds the child its view places, inside its own envelope", async () => {
  const response = await get("/nested");
  assert.equal(response.status, 200);
  const page = await response.text();
  assert.ok(!/<assembly[\s>]/i.test(page), "no placement directive is ever emitted");
  const parents = treeOf(page);
  assert.deepEqual(parents.map(nameOf), Object.keys(PLACES));
  for (const parent of parents) {
    assert.deepEqual(parent.children.map(nameOf), [PLACES[nameOf(parent)]], nameOf(parent));
    for (const envelope of [parent, ...parent.children]) {
      assert.equal(envelope.attributes["data-failed"], undefined, nameOf(envelope));
      assert.equal(envelope.children.length, envelope === parent ? 1 : 0);
    }
  }
  // The child rendered: what each framework writes of its own is in the page.
  for (const framework of ["react", "preact", "solid", "svelte", "vue", "lit"]) {
    assert.match(page, new RegExp(`data-framework="${framework}"`));
  }
});

test("a service shapes which view of its child a parent places", async () => {
  // The parent's template writes the view from its data; the composer reads it once rendered.
  const [parent] = treeOf(await (await get("/assembly/ejs-nest/")).text());
  assert.equal(parent?.children[0]?.attributes["data-name"], "svelte-label");
  assert.equal(parent?.children[0]?.attributes["data-view"], "default");
});

test("a parent's own content endpoint answers it composed, its child inside", async () => {
  for (const [parent, child] of Object.entries(PLACES)) {
    const response = await get(`/assembly/${parent}/`);
    assert.equal(response.status, 200, parent);
    const [answered] = treeOf(await response.text());
    assert.equal(nameOf(answered), parent);
    assert.deepEqual(answered.children.map(nameOf), [child], parent);
  }
});

test("a shadow parent links its child's stylesheet inside its own root, and the page does not", async () => {
  const page = await (await get("/nested")).text();
  const root =
    /<assembly-root\b[^>]*data-name="shadow-nest"[^>]*><template shadowrootmode="open">([\s\S]*?)<\/template>/.exec(
      page,
    )?.[1] ?? "";
  assert.match(root, /data-name="tinted"/);
  assert.match(root, /<link rel="stylesheet" href="[^"]*tinted[^"]*\.css">/);
  const head = page.slice(0, page.indexOf("</head>"));
  assert.ok(!/tinted[^"]*\.css/.test(head), "a sheet in the head would not reach into the root");
});

test("a chain of assemblies renders as deep as the cap, and the one past it is refused", async () => {
  let [link] = treeOf(await (await get("/deep")).text());
  for (let level = 1; level <= 8; level += 1) {
    assert.equal(nameOf(link), `deep-${level}`);
    assert.equal(link.attributes["data-failed"], undefined, `deep-${level} rendered`);
    [link] = link.children;
  }
  // The ninth is refused before it is dispatched, marked failed, with an id its page logged.
  assert.equal(nameOf(link), "deep-9");
  assert.ok(await logged(link.attributes["data-failed"]));
  assert.deepEqual(link.children, []);
});

test("a view that places itself renders once, and holds one refusal where it would repeat", async () => {
  // A Pug view writes the directive in its own syntax, so nothing reads it before it renders.
  const [outer] = treeOf(await (await get("/looped")).text());
  assert.equal(nameOf(outer), "loop");
  assert.equal(outer.attributes["data-failed"], undefined);
  assert.deepEqual(outer.children.map(nameOf), ["loop"]);
  assert.ok(await logged(outer.children[0].attributes["data-failed"]));
  assert.deepEqual(outer.children[0].children, []);
});

test("the headers a composer sends hold a child to its ancestors and to the cap", async () => {
  // As a parent's own server asks: the child named among the ancestors is its own ancestor.
  const byPath = await get("/assembly/html-nest/", { "assembly-path": "react-label/default" });
  assert.equal(byPath.status, 200);
  const [looped] = treeOf(await byPath.text());
  assert.equal(looped.attributes["data-failed"], undefined, "the parent itself rendered");
  assert.ok(await logged(looped.children[0]?.attributes["data-failed"]));
  // And at the cap, nothing may be placed one deeper.
  const byDepth = await get("/assembly/html-nest/", { "assembly-depth": "8" });
  const [capped] = treeOf(await byDepth.text());
  assert.ok(await logged(capped.children[0]?.attributes["data-failed"]));
  // One level above the cap, the same child is placed.
  const [within] = treeOf(
    await (await get("/assembly/html-nest/", { "assembly-depth": "7" })).text(),
  );
  assert.equal(within.children[0]?.attributes["data-failed"], undefined);
});

test("a deferred parent is served empty, with the runtime its child will need linked ahead", async () => {
  const page = await (await get("/nested-later")).text();
  const [placeholder, ...others] = treeOf(page);
  assert.deepEqual(others, []);
  assert.equal(nameOf(placeholder), "html-nest");
  assert.equal(placeholder.attributes["data-defer"], "");
  assert.deepEqual(placeholder.children, [], "its child arrives with the answer that fills it");
  // A plain html parent has no browser half: the script is its child's, linked from its source.
  assert.match(page, /<script type="module" src="[^"]+"/);
  const filled = await get("/assembly/html-nest/default/", {
    "assembly-id": placeholder.attributes["data-id"],
    "assembly-depth": "1",
  });
  const [answer] = treeOf(await filled.text());
  assert.equal(answer.attributes["data-id"], placeholder.attributes["data-id"]);
  assert.deepEqual(answer.children.map(nameOf), ["react-label"]);
});

test("a view whose source places itself is refused before anything is built or listens", async () => {
  // In a copy of the project, so the server under test and its build are left as they are.
  const root = rootOf();
  const copy = mkdtempSync(join(tmpdir(), "assemblejs-nested-refused-"));
  try {
    cpSync(root, copy, {
      recursive: true,
      filter: (from) => !["node_modules", "dist", ".assemblejs", "deploy"].includes(basename(from)),
    });
    symlinkSync(join(root, "node_modules"), join(copy, "node_modules"));
    mkdirSync(join(copy, "src", "assemblies", "selfish"));
    writeFileSync(
      join(copy, "src", "assemblies", "selfish", "selfish.html"),
      '<p>selfish</p><assembly name="selfish"></assembly>\n',
    );
    const run = (verb) => spawnSync("npx", ["assemblejs", verb], { cwd: copy, encoding: "utf8" });
    const checked = run("check");
    assert.equal(checked.status, 1, checked.stdout);
    assert.match(
      checked.stderr,
      /^src\/assemblies\/selfish\/selfish\.html: "selfish" places itself, and no render lets an assembly be its own ancestor \(an-assembly-is-never-its-own-ancestor\): /m,
    );
    // The build writes what it read; the server that would serve it refuses to start.
    const built = run("build");
    assert.equal(built.status, 0, built.stderr);
    const server = await started(copy, { ASSEMBLEJS_MODE: "production" });
    try {
      assert.equal(server.origin, undefined, "a server that would loop on every render listens");
      assert.notEqual(await server.exit(), 0);
      assert.match(server.output(), /assembly "selfish" view "default" places itself/);
    } finally {
      await server.stop();
    }
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
});
