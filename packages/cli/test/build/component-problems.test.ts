// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { checkProject, componentProblems, discoverAssemblies } from "@assemblejs/cli";
import { templatedProject } from "../fixtures/templated-project.js";

// The example that installs Svelte and Vue: a project nested in it finds their compilers.
const FRAMEWORKS = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
const made: string[] = [];
afterAll(() => {
  for (const root of made) rmSync(root, { recursive: true, force: true });
});
// Each view in an assembly named for its file, in a project that would build.
const project = (views: Record<string, string>, at = FRAMEWORKS): string =>
  templatedProject(
    made,
    {
      "package.json": "{}",
      "src/server.ts": "",
      "src/pages/home/home.html": "<body></body>",
      ...Object.fromEntries(
        Object.entries(views).map(([name, source]) => [
          `src/assemblies/${name.split(".")[0] ?? name}/${name}`,
          source,
        ]),
      ),
    },
    at,
  );
const found = (root: string) => componentProblems(root, discoverAssemblies(root).assemblies);

const SVELTE = "<script>\n  let { data } = $props();\n</script>\n<p>{data.title}</p>\n";
const VUE = "<template>\n  <p>{{ title }}</p>\n</template>\n";

describe("the Svelte and Vue views a project's own compiler refuses", () => {
  it("are none, where each compiler reads its view", async () => {
    expect(await found(project({ "board.svelte": SVELTE, "panel.vue": VUE }))).toEqual([]);
  });

  // check said no problems of a project the build then refused.
  it("are each named at the view, with what the compiler said and the line it said it of", async () => {
    const root = project({
      "bad-board.svelte": "<h1>shop</h1>\n<p>{</p>\n",
      "bad-panel.vue": "<template>\n  <p>{{ </p>\n</template>\n",
      "board.svelte": SVELTE,
    });
    const problems = await found(root);
    expect(problems.map((problem) => [problem.path, problem.rule])).toEqual([
      [join(root, "src/assemblies/bad-board/bad-board.svelte"), "a-template-view-compiles"],
      [join(root, "src/assemblies/bad-panel/bad-panel.vue"), "a-template-view-compiles"],
    ]);
    expect(problems[0]?.message).toMatch(
      /^"bad-board" does not compile as svelte: Unexpected token .*\(line 2\)$/,
    );
    expect(problems[1]?.message).toMatch(/^"bad-panel" does not compile as vue: .+\(line 2\)$/);
    expect(problems[1]?.message).not.toContain(root);
    expect(problems.map((problem) => problem.fix)).toEqual([
      "correct the view so svelte can read it",
      "correct the view so vue can read it",
    ]);
  });

  it("are what check reports, which answered clean for a view the build refuses", async () => {
    const root = project({ "bad-board.svelte": "<p>{</p>\n" });
    const rules = (await checkProject(root)).map((problem) => problem.rule);
    expect(rules).toContain("a-template-view-compiles");
  });

  it("are none where the project has no compiler, which is a finding of its own", async () => {
    const root = project({ "bad-board.svelte": "<p>{</p>\n" }, tmpdir());
    expect(await found(root)).toEqual([]);
    const rules = (await checkProject(root)).map((problem) => problem.rule);
    expect(rules).toContain("a-view-needs-its-renderer");
    expect(rules).not.toContain("a-template-view-compiles");
  });

  it("do not include a view that leads out of the project, which is not opened", async () => {
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    made.push(outside);
    writeFileSync(join(outside, "elsewhere.svelte"), "<p>{</p>\n");
    const root = project({ "board.svelte": SVELTE });
    rmSync(join(root, "src/assemblies/board/board.svelte"));
    symlinkSync(join(outside, "elsewhere.svelte"), join(root, "src/assemblies/board/board.svelte"));
    expect(await found(root)).toEqual([]);
  });
});
