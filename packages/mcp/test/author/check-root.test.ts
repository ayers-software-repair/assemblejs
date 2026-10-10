// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkRoot, resolveRoot } from "@assemblejs/mcp";

describe("checking through the agent surface", () => {
  it("answers ok for a project with nothing wrong", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-check-"));
    writeFileSync(join(dir, "package.json"), "{}");
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "src", "server.ts"), "");
    expect(await checkRoot(resolveRoot(dir))).toMatchObject({ ok: true, problems: [] });
  });

  it("answers every finding as a structure with its file, rule and fix", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-check-"));
    writeFileSync(join(dir, "package.json"), "{}");
    mkdirSync(join(dir, "src", "assemblies", "Cart"), { recursive: true });
    const answer = await checkRoot(resolveRoot(dir));
    expect(answer.ok).toBe(false);
    expect(answer.problems[0]).toMatchObject({
      path: "src/assemblies/Cart",
      rule: "directory-is-an-assembly",
      fix: 'rename the directory to "cart"',
    });
  });
});

// What check reads, an agent is shown, its findings' own words included. So check stops at the
// project's root, after every link is followed: a link out is a finding, and the file it leads
// to is never opened, not even to say that it does not compile.
describe("checking a project with links that lead out of it", () => {
  const tree = (prefix: string, files: Record<string, string>): string => {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    for (const [path, contents] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), contents);
    }
    return dir;
  };
  const linked = (links: Record<string, string>): string => {
    const outside = tree("mcp-outside-", {
      "broken.page.ts": 'export default { route: "/SECRET-UNFINISHED',
      "secret.api.ts": 'export default { path: "SECRET-NO-SLASH" };',
      "secret.config.ts": "export default { budgets: { document: SECRET_BUDGET } ",
      "pagedir/landing.html": '<main><assembly name="secret-placed"></assembly></main>',
      "asm/stolen.html": '<assembly name="secret-child" timeout="SECRET"></assembly>',
      "secret.css": "p { color: SECRET-COLOUR",
    });
    const dir = tree("mcp-linked-", {
      "package.json": "{}",
      "src/server.ts": "",
      "src/assemblies/hello/hello.html": "<p>hi</p>",
      "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
    });
    for (const [link, target] of Object.entries(links)) {
      mkdirSync(dirname(join(dir, link)), { recursive: true });
      symlinkSync(join(outside, target), join(dir, link));
    }
    return dir;
  };
  const LINKS = {
    "src/pages/home/home.page.ts": "broken.page.ts",
    "src/pages/landing": "pagedir",
    "src/pages/about/about.html": "pagedir/landing.html",
    "src/api/prices.api.ts": "secret.api.ts",
    "assemblejs.config.ts": "secret.config.ts",
    "src/assemblies/stolen": "asm",
    "src/assemblies/shell/shell.html": "asm/stolen.html",
    "src/assemblies/hello/hello.css": "secret.css",
  };

  it("says nothing of what any of them leads to, in any finding's words", async () => {
    const answer = await checkRoot(resolveRoot(linked(LINKS)));
    expect(JSON.stringify(answer)).not.toMatch(/SECRET|secret-/);
  });

  it("reports each link as a finding of its own, by the rule that says why", async () => {
    const answer = await checkRoot(resolveRoot(linked(LINKS)));
    expect(answer.ok).toBe(false);
    const found = answer.problems
      .filter((problem) => typeof problem !== "string")
      .map((problem) => [problem.path, problem.rule]);
    expect(found.sort()).toEqual(
      Object.keys(LINKS)
        .sort()
        .map((path) => [path, "a-project-stays-inside-its-root"]),
    );
  });
});
