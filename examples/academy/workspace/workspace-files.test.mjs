// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { WorkspaceFiles } from "./workspace-files.js";

const roots = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true })));
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), "academy-editor-"));
  roots.push(root);
  writeFileSync(join(root, "view.tsx"), "original");
  const project = {
    async readFile(path) {
      return readFileSync(join(root, path), "utf8");
    },
    async writeFile(path, after, before) {
      if (readFileSync(join(root, path), "utf8") !== before) throw new Error("project changed");
      writeFileSync(join(root, path), after);
    },
  };
  return { root, project, files: new WorkspaceFiles(project, ["view.tsx"]) };
};

test("opening and editing do not write; save changes the actual file", async () => {
  const { files, root } = fixture();
  await files.open("view.tsx");
  files.edit("view.tsx", "edited");
  assert.equal(readFileSync(join(root, "view.tsx"), "utf8"), "original");
  assert.equal((await files.save("view.tsx")).dirty, false);
  assert.equal(readFileSync(join(root, "view.tsx"), "utf8"), "edited");
});

test("a concurrent outside edit survives a stale save; the learner buffer is retained", async () => {
  const { files, root } = fixture();
  await files.open("view.tsx");
  files.edit("view.tsx", "learner");
  writeFileSync(join(root, "view.tsx"), "outside");
  await assert.rejects(files.save("view.tsx"), /project changed/);
  assert.equal(readFileSync(join(root, "view.tsx"), "utf8"), "outside");
  assert.deepEqual(files.buffer("view.tsx"), { base: "original", text: "learner", dirty: true });
});

test("edits made during a save remain dirty against the saved version", async () => {
  const { files, project, root } = fixture();
  await files.open("view.tsx");
  files.edit("view.tsx", "first");
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const write = project.writeFile;
  project.writeFile = async (...args) => {
    await gate;
    return write(...args);
  };
  const saving = files.save("view.tsx");
  files.edit("view.tsx", "second");
  await assert.rejects(files.save("view.tsx"), /already being saved/);
  release();
  assert.deepEqual(await saving, { base: "first", text: "second", dirty: true });
  assert.equal(readFileSync(join(root, "view.tsx"), "utf8"), "first");
  assert.equal((await files.save("view.tsx")).dirty, false);
  assert.equal(readFileSync(join(root, "view.tsx"), "utf8"), "second");
});

test("failed writes remain retryable and cannot be reported as a saved buffer", async () => {
  const { files, project } = fixture();
  await files.open("view.tsx");
  files.edit("view.tsx", "changed");
  const write = project.writeFile;
  project.writeFile = async () => {
    throw new Error("storage unavailable");
  };
  await assert.rejects(files.save("view.tsx"), /storage unavailable/);
  assert.equal(files.buffer("view.tsx").dirty, true);
  project.writeFile = write;
  assert.equal((await files.save("view.tsx")).dirty, false);
});

test("duplicate or unconfined files and unopened edits are refused", async () => {
  const { project, files } = fixture();
  for (const path of [
    "../outside",
    "/outside",
    "a/../outside",
    "a\\outside",
    "./a",
    "a/./b",
    "a//b",
    "a/",
    "C:/outside",
    "C:outside",
    "",
  ])
    assert.throws(() => new WorkspaceFiles(project, [path]), /confined/);
  assert.throws(() => new WorkspaceFiles(project, ["a", "a"]), /duplicate/);
  await assert.rejects(files.open("outside"), /outside/);
  assert.throws(() => files.edit("view.tsx", "lost"), /not been opened/);
});

test("reload reads current project bytes only for an existing clean buffer", async () => {
  const { files, root } = fixture();
  await assert.rejects(files.reload("outside.ts"), /not been opened/);
  await files.open("view.tsx");
  writeFileSync(join(root, "view.tsx"), "agent edit");
  assert.deepEqual(await files.reload("view.tsx"), {
    base: "agent edit",
    text: "agent edit",
    dirty: false,
  });
  files.edit("view.tsx", "learner draft");
  await assert.rejects(files.reload("view.tsx"), /clean idle/);
  assert.equal(files.buffer("view.tsx").text, "learner draft");
});

test("a draft typed during reload survives and concurrent reloads are refused", async () => {
  const { files, project } = fixture();
  await files.open("view.tsx");
  let release;
  project.readFile = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const reading = files.reload("view.tsx");
  await assert.rejects(files.reload("view.tsx"), /clean idle/);
  files.edit("view.tsx", "new draft");
  release("agent edit");
  await assert.rejects(reading, /buffer changed/);
  assert.deepEqual(files.buffer("view.tsx"), { base: "original", text: "new draft", dirty: true });
});

test("confirmed new paths extend the file list without changing drafts or admitting partial invalid lists", async () => {
  const { files, root } = fixture();
  await files.open("view.tsx");
  files.edit("view.tsx", "draft");
  writeFileSync(join(root, "added.html"), "<p>New source</p>");
  assert.equal(files.addPaths(["added.html", "view.tsx"]), true);
  assert.deepEqual(files.paths, ["added.html", "view.tsx"]);
  assert.equal(files.addPaths(["added.html"]), false);
  assert.equal((await files.open("added.html")).text, "<p>New source</p>");
  assert.equal(files.buffer("view.tsx").text, "draft");
  assert.throws(() => files.addPaths(["not-added.ts", "../outside.ts"]), /confined/);
  assert.equal(files.paths.includes("not-added.ts"), false);
});
