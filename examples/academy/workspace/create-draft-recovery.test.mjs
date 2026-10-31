// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { Window } from "happy-dom";
import { createSourceEditor } from "./create-source-editor.js";

const fixture = () => {
  const window = new Window({ url: "https://academy.example/?editor" });
  const files = new Map([["src/page.html", "<p>Original</p>\n"]]);
  const writes = [];
  const project = {
    async readFile(path) {
      return files.get(path);
    },
    async writeFile(path, after, before) {
      if (files.get(path) !== before) throw new Error("source changed since review");
      writes.push({ path, before, after });
      files.set(path, after);
    },
  };
  const open = async () => {
    const editor = createSourceEditor(window.document.body, project, [...files.keys()]);
    await editor.open("src/page.html");
    const input = window.document.querySelector('[aria-label="Source code"]');
    const edit = (text) => {
      input.value = text;
      input.dispatchEvent(new window.Event("input"));
    };
    const button = (name) =>
      [...window.document.querySelectorAll("button")].find((node) => node.textContent === name);
    return { editor, input, edit, button };
  };
  return { window, files, writes, project, open };
};

test("a recreated editor recovers its unsaved draft without writing the project", async () => {
  const f = fixture();
  const original = f.files.get("src/page.html");
  const first = await f.open();
  first.edit("<p>My unsaved introduction 茶</p>\n");
  first.editor.destroy();
  const resumed = await f.open();
  assert.equal(resumed.input.value, "<p>My unsaved introduction 茶</p>\n");
  assert.equal(f.files.get("src/page.html"), original);
  assert.equal(f.writes.length, 0);
  resumed.button("Save file").click();
  await setImmediate();
  assert.equal(f.files.get("src/page.html"), resumed.input.value);
  assert.equal(f.writes.length, 1);
  assert.equal(f.window.sessionStorage.length, 0);
});

test("changed project source and its recovered draft remain separate until explicit review", async () => {
  const f = fixture();
  const first = await f.open();
  first.edit("<p>Recovered learner work</p>\n");
  first.editor.destroy();
  const outside = "<p>Outside agent change</p>\n";
  f.files.set("src/page.html", outside);
  const resumed = await f.open();
  assert.equal(resumed.input.value, outside);
  const recovered = f.window.document.querySelector('[aria-label="Recovered draft"]');
  assert.equal(recovered.value, "<p>Recovered learner work</p>\n");
  assert.equal(recovered.readOnly, true);
  assert.equal(f.writes.length, 0);
  const key = f.window.sessionStorage.key(0);
  const stored = f.window.sessionStorage.getItem(key);
  resumed.edit(outside + "<p>Manually merged learner work</p>\n");
  assert.equal(f.window.sessionStorage.getItem(key), stored);
  resumed.button("Discard recovered draft").click();
  const reviewed = JSON.parse(f.window.sessionStorage.getItem(key));
  assert.equal(reviewed.base, outside);
  assert.equal(reviewed.text, resumed.input.value);
  assert.equal(f.files.get("src/page.html"), outside);
  resumed.button("Save file").click();
  await setImmediate();
  assert.equal(f.files.get("src/page.html"), reviewed.text);
  assert.equal(f.writes.length, 1);
});

test("a matching recovered draft keeps its original expected base when another writer acts later", async () => {
  const f = fixture();
  const first = await f.open();
  first.edit("learner draft");
  first.editor.destroy();
  const resumed = await f.open();
  f.files.set("src/page.html", "later outside change");
  resumed.button("Save file").click();
  await setImmediate();
  assert.equal(resumed.input.value, "learner draft");
  assert.equal(f.files.get("src/page.html"), "later outside change");
  assert.equal(f.writes.length, 0);
  assert.match(f.window.document.querySelector('[role="status"]').textContent, /Not saved/);
  const record = JSON.parse(f.window.sessionStorage.getItem(f.window.sessionStorage.key(0)));
  assert.equal(record.base, "<p>Original</p>\n");
  assert.equal(record.text, "learner draft");
});

test("malformed or oversized cached values are preserved and never restored into source", async () => {
  for (const malformed of [
    "{",
    "null",
    JSON.stringify({ base: 1, text: "wrong type" }),
    JSON.stringify({ base: "<p>Original</p>\n", text: "draft", other: "unexpected" }),
    JSON.stringify({ base: "<p>Original</p>\n", text: "茶".repeat(22000) }),
    "x".repeat(800001),
  ]) {
    const f = fixture();
    const first = await f.open();
    first.edit("a draft");
    const key = f.window.sessionStorage.key(0);
    f.window.sessionStorage.setItem(key, malformed);
    first.editor.destroy();
    const resumed = await f.open();
    assert.equal(resumed.input.value, "<p>Original</p>\n");
    assert.equal(f.window.sessionStorage.getItem(key), malformed);
    assert.match(
      f.window.document.querySelector(".academy-draft-recovery").textContent,
      /Draft recovery unavailable/,
    );
    resumed.edit("new in-memory edit");
    assert.equal(f.window.sessionStorage.getItem(key), malformed);
    assert.equal(f.writes.length, 0);
    resumed.button("Discard recovered draft").click();
    assert.equal(JSON.parse(f.window.sessionStorage.getItem(key)).text, "new in-memory edit");
  }
});

test("a denied storage read cannot later overwrite an unread older draft", async () => {
  const f = fixture();
  const first = await f.open();
  first.edit("older stored draft");
  first.editor.destroy();
  const storage = f.window.sessionStorage;
  const key = storage.key(0);
  const stored = storage.getItem(key);
  let denied = true;
  Object.defineProperty(f.window, "sessionStorage", {
    get() {
      if (denied) throw new Error("storage denied");
      return storage;
    },
  });
  const resumed = await f.open();
  resumed.edit("newer in-memory draft");
  assert.match(
    f.window.document.querySelector(".academy-draft-recovery").textContent,
    /storage denied/,
  );
  assert.match(
    f.window.document.querySelector(".academy-draft-recovery").textContent,
    /only in memory/,
  );
  denied = false;
  resumed.edit("newest in-memory draft");
  assert.equal(storage.getItem(key), stored);
  resumed.button("Discard recovered draft").click();
  assert.equal(JSON.parse(storage.getItem(key)).text, "newest in-memory draft");
  assert.equal(f.writes.length, 0);
});

test("quota failures keep the buffer and do not claim the latest draft was persisted", async () => {
  const f = fixture();
  const view = await f.open();
  view.edit("earlier cached draft");
  const storage = f.window.sessionStorage;
  const key = storage.key(0);
  const earlier = storage.getItem(key);
  Object.defineProperty(f.window, "sessionStorage", {
    value: {
      getItem: (name) => storage.getItem(name),
      setItem() {
        throw new Error("quota exceeded");
      },
      removeItem: (name) => storage.removeItem(name),
    },
  });
  view.edit("latest in-memory draft");
  await view.editor.open("src/page.html");
  assert.equal(view.input.value, "latest in-memory draft");
  assert.equal(storage.getItem(key), earlier);
  assert.match(
    f.window.document.querySelector(".academy-draft-recovery").textContent,
    /quota exceeded/,
  );
  assert.equal(f.writes.length, 0);
});

test("typing during a successful save persists the newer draft against the actual saved base", async () => {
  const f = fixture();
  const view = await f.open();
  view.edit("the source being saved");
  let release;
  const wait = new Promise((resolve) => {
    release = resolve;
  });
  const write = f.project.writeFile.bind(f.project);
  f.project.writeFile = async (...args) => {
    await wait;
    return write(...args);
  };
  view.button("Save file").click();
  await setImmediate();
  view.edit("newer draft while saving");
  release();
  await setImmediate();
  assert.equal(f.files.get("src/page.html"), "the source being saved");
  const record = JSON.parse(f.window.sessionStorage.getItem(f.window.sessionStorage.key(0)));
  assert.deepEqual(record, { base: "the source being saved", text: "newer draft while saving" });
  view.editor.destroy();
  const resumed = await f.open();
  assert.equal(resumed.input.value, "newer draft while saving");
  assert.equal(f.writes.length, 1);
});

test("a stale cached draft already identical to saved source is removed without a project write", async () => {
  const f = fixture();
  const first = await f.open();
  first.edit("already saved elsewhere");
  first.editor.destroy();
  f.files.set("src/page.html", "already saved elsewhere");
  const resumed = await f.open();
  assert.equal(resumed.input.value, "already saved elsewhere");
  assert.equal(resumed.button("Save file").disabled, true);
  assert.equal(f.window.sessionStorage.length, 0);
  assert.equal(f.writes.length, 0);
});
