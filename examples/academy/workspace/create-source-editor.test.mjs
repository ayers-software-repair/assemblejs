// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setImmediate } from "node:timers/promises";
import { afterEach, test } from "node:test";
import { Window } from "happy-dom";
import { createSourceEditor } from "./create-source-editor.js";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true })));
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), "academy-code-view-"));
  roots.push(root);
  for (const file of ["a.tsx", "b.html"]) writeFileSync(join(root, file), `original ${file}`);
  const window = new Window();
  const document = window.document;
  const project = {
    async readFile(path) {
      return readFileSync(join(root, path), "utf8");
    },
    async writeFile(path, after, before) {
      if (readFileSync(join(root, path), "utf8") !== before) throw new Error("project changed");
      writeFileSync(join(root, path), after);
    },
  };
  const editor = createSourceEditor(document.body, project, ["a.tsx", "b.html"]);
  const input = document.querySelector("textarea");
  const edit = (text) => {
    input.value = text;
    input.dispatchEvent(new window.Event("input"));
  };
  return { window, document, project, editor, input, edit, root };
};

test("the file list and open tabs retain independent unsaved buffers", async () => {
  const { document, editor, input, edit, root } = fixture();
  await editor.open("a.tsx");
  edit("export const count = 2;");
  await editor.open("b.html");
  edit("<p>Another file</p>");
  await editor.open("a.tsx");
  assert.equal(input.value, "export const count = 2;");
  assert.equal(readFileSync(join(root, "a.tsx"), "utf8"), "original a.tsx");
  assert.equal(document.querySelectorAll('nav[aria-label="Open files"] button').length, 2);
  assert.equal(document.querySelector('[aria-current="true"]').textContent, "a.tsx *");
  assert.ok(document.querySelector(".hljs-keyword"));
});

test("save writes the provider's file and never claims preview or check success", async () => {
  const { document, editor, edit, root } = fixture();
  await editor.open("a.tsx");
  edit("saved");
  document.querySelector("section > button").click();
  await setImmediate();
  assert.equal(readFileSync(join(root, "a.tsx"), "utf8"), "saved");
  assert.equal(
    document.querySelector('[role="status"]').textContent,
    "Saved a.tsx. Run checks to update the preview.",
  );
});

test("a refused stale save keeps both the outside file and editable buffer", async () => {
  const { document, editor, input, edit, root } = fixture();
  await editor.open("a.tsx");
  edit("my draft");
  writeFileSync(join(root, "a.tsx"), "outside edit");
  document.querySelector("section > button").click();
  await setImmediate();
  assert.match(
    document.querySelector('[role="status"]').textContent,
    /Not saved:.*project changed/,
  );
  assert.equal(input.value, "my draft");
  assert.equal(readFileSync(join(root, "a.tsx"), "utf8"), "outside edit");
  assert.equal(document.querySelector("section > button").disabled, false);
});

test("source markup is escaped in the highlighted layer", async () => {
  const { document, editor, edit } = fixture();
  await editor.open("b.html");
  const source = '<img src="x" onerror="bad()"><script>bad()</script>';
  edit(source);
  assert.equal(document.querySelector("pre").textContent, source + "\n");
  assert.equal(document.querySelectorAll("img, script").length, 0);
  assert.equal(document.querySelector("pre").getAttribute("aria-hidden"), "true");
});

test("a late file read cannot replace the latest selection", async () => {
  const { document, editor, project, input } = fixture();
  const read = project.readFile;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  project.readFile = async (path) => {
    if (path === "a.tsx") await gate;
    return read(path);
  };
  const earlier = editor.open("a.tsx");
  await editor.open("b.html");
  release();
  await earlier;
  assert.equal(document.querySelector("h2").textContent, "b.html");
  assert.equal(input.value, "original b.html");
});

test("read errors remain visible and disposal cannot repopulate the container", async () => {
  const { document, editor, project } = fixture();
  project.readFile = async () => {
    throw new Error("unavailable");
  };
  await editor.open("a.tsx");
  assert.match(document.querySelector('[role="status"]').textContent, /unavailable/);
  assert.equal(document.querySelector("textarea").disabled, true);
  editor.destroy();
  await editor.open("b.html");
  assert.equal(document.body.children.length, 0);
});

test("Home at the first character clears retained scroll without changing the buffer", async () => {
  const { window, document, editor, input } = fixture();
  await editor.open("a.tsx");
  const painted = document.querySelector("pre");
  input.setSelectionRange(0, 0);
  input.scrollTop = 19;
  painted.scrollTop = 19;
  input.dispatchEvent(new window.KeyboardEvent("keyup", { key: "Home", ctrlKey: true }));
  assert.equal(input.scrollTop, 0);
  assert.equal(painted.scrollTop, 0);
  assert.equal(input.value, "original a.tsx");
  assert.equal(editor.files.buffer("a.tsx").dirty, false);
});

test("explicit clean reload follows an agent change and is disabled for unsaved edits", async () => {
  const { document, editor, input, edit, root } = fixture();
  await editor.open("a.tsx");
  const reload = [...document.querySelectorAll("button")].find(
    (button) => button.textContent === "Reload file",
  );
  writeFileSync(join(root, "a.tsx"), "agent edit");
  reload.click();
  await setImmediate();
  assert.equal(input.value, "agent edit");
  assert.equal(editor.files.buffer("a.tsx").base, "agent edit");
  edit("learner draft");
  assert.equal(reload.disabled, true);
  assert.equal(input.value, "learner draft");
});
