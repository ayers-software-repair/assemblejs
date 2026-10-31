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
