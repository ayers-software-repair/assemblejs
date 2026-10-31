// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { createProjectFiles } from "./create-project-files.js";
import { WorkspaceFiles } from "./workspace-files.js";

const reply = (result, ok = true, problems = []) => ({
  content: [{ type: "text", text: JSON.stringify({ ok, result, problems }) }],
});

test("reads exact source and saves the retained base through the shared tools", async () => {
  const calls = [];
  const project = createProjectFiles({
    async callTool(request) {
      calls.push(request);
      return request.name === "read_source"
        ? reply({ path: "src/view.html", contents: "before 茶" })
        : reply({ written: ["src/view.html"] });
    },
  });
  const files = new WorkspaceFiles(project, ["src/view.html"]);
  await files.open("src/view.html");
  files.edit("src/view.html", "after 茶");
  assert.equal((await files.save("src/view.html")).dirty, false);
  assert.deepEqual(calls, [
    { name: "read_source", arguments: { path: "src/view.html" } },
    {
      name: "apply_source_changes",
      arguments: {
        changes: [{ path: "src/view.html", before: "before 茶", after: "after 茶" }],
      },
    },
  ]);
});

test("a missing or failed read never becomes an empty writable buffer", async () => {
  for (const answer of [
    reply({ path: "src/a.ts", missing: true }, false, ["ENOENT"]),
    reply(null, false, ["access denied"]),
    reply({ path: "src/other.ts", contents: "wrong" }),
    reply({ path: "src/a.ts", contents: 1 }),
    reply({ path: "src/a.ts", contents: "text" }, true, ["warning"]),
  ]) {
    const files = new WorkspaceFiles(createProjectFiles({ callTool: async () => answer }), [
      "src/a.ts",
    ]);
    await assert.rejects(files.open("src/a.ts"));
    assert.throws(() => files.buffer("src/a.ts"), /not been opened/);
  }
});

test("stale/partial failures preserve draft and expose actual attempted paths", async () => {
  for (const result of [
    { written: [], attempted: [] },
    { written: [], attempted: ["src/a.ts"] },
  ]) {
    const project = createProjectFiles({
      callTool: async ({ name }) =>
        name === "read_source"
          ? reply({ path: "src/a.ts", contents: "old" })
          : reply(result, false, ["actual storage refusal"]),
    });
    const files = new WorkspaceFiles(project, ["src/a.ts"]);
    await files.open("src/a.ts");
    files.edit("src/a.ts", "draft");
    await assert.rejects(files.save("src/a.ts"), (error) => {
      assert.match(error.message, /actual storage refusal/);
      assert.match(error.message, /attempted/);
      return true;
    });
    assert.deepEqual(files.buffer("src/a.ts"), { base: "old", text: "draft", dirty: true });
  }
});

test("forged or ambiguous write success cannot advance the editor base", async () => {
  for (const result of [
    null,
    {},
    { written: [] },
    { written: ["src/other.ts"] },
    { written: ["src/a.ts", "src/extra.ts"] },
    { written: "src/a.ts" },
  ]) {
    const files = new WorkspaceFiles(
      createProjectFiles({
        callTool: async ({ name }) =>
          name === "read_source" ? reply({ path: "src/a.ts", contents: "old" }) : reply(result),
      }),
      ["src/a.ts"],
    );
    await files.open("src/a.ts");
    files.edit("src/a.ts", "draft");
    await assert.rejects(files.save("src/a.ts"), /inspect source/);
    assert.equal(files.buffer("src/a.ts").base, "old");
    assert.equal(files.buffer("src/a.ts").dirty, true);
  }
});
