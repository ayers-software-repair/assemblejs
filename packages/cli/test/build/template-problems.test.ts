// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { buildProject, checkProject, discoverAssemblies, templateProblems } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

// Nested in the example that installs the templates package, as a project that did would be.
const templates = fileURLToPath(new URL("../../../../examples/templates/", import.meta.url));
const made: string[] = [];
afterAll(() => {
  for (const root of made) rmSync(root, { recursive: true, force: true });
});
const project = (views: Record<string, string>, at = templates): string => {
  const root = mkdtempSync(join(at, ".dev-template-"));
  made.push(root);
  writeFileSync(join(root, "package.json"), "{}");
  mkdirSync(join(root, "src", "pages", "home"), { recursive: true });
  writeFileSync(join(root, "src", "server.ts"), "");
  writeFileSync(join(root, "src", "pages", "home", "home.html"), "<body></body>");
  for (const [name, source] of Object.entries(views)) {
    const assembly = name.split(".")[0] ?? name;
    mkdirSync(join(root, "src", "assemblies", assembly), { recursive: true });
    writeFileSync(join(root, "src", "assemblies", assembly, name), source);
  }
  return root;
};
const found = (root: string) => templateProblems(root, discoverAssemblies(root).assemblies);
const quiet: Io = {
  write: () => undefined,
  exists: () => false,
  log: () => undefined,
  error: () => undefined,
};

describe("template views the project's own engine cannot read", () => {
  it("passes a template each engine reads, and a markdown view whatever it holds", async () => {
    const root = project({
      "ok-ejs.ejs": "<p><%= data.n %></p>",
      "ok-hbs.hbs": "<p>{{data.n}}</p>",
      "ok-njk.njk": "<p>{{ data.n }}</p>",
      "ok-pug.pug": "p= data.n",
      "ok-md.md": "# {{ not a template }} <% nor this %>",
    });
    expect(await found(root)).toEqual([]);
  });

  it("refuses an unclosed block in each language, naming the file and what the engine said", async () => {
    const root = project({
      "bad-ejs.ejs": "<% if (data.n) { %><p>never closed</p>",
      "bad-hbs.hbs": "{{#if data.n}}never closed",
      "bad-njk.njk": "{% if data.n %}never closed",
      "bad-pug.pug": "p\n  - if (\n",
    });
    const problems = await found(root);
    expect(problems.map((problem) => problem.rule)).toEqual(
      Array(4).fill("a-template-view-compiles"),
    );
    expect(problems.map((problem) => problem.path).sort()).toEqual(
      [
        "src/assemblies/bad-ejs/bad-ejs.ejs",
        "src/assemblies/bad-hbs/bad-hbs.hbs",
        "src/assemblies/bad-njk/bad-njk.njk",
        "src/assemblies/bad-pug/bad-pug.pug",
      ].map((path) => join(root, path)),
    );
    for (const problem of problems) {
      expect(problem.message).toMatch(/does not compile as (ejs|handlebars|nunjucks|pug): ./);
      expect(problem.fix).toMatch(/correct the template/);
    }
  });

  it("reports a view it cannot read, and a package it cannot load, as their own problems", async () => {
    const root = project({ "ok-ejs.ejs": "<p></p>" });
    mkdirSync(join(root, "src", "assemblies", "dir", "dir.pug"), { recursive: true });
    const [unread] = await found(root);
    expect(unread).toMatchObject({
      path: join(root, "src/assemblies/dir/dir.pug"),
      rule: "a-template-view-compiles",
      message: expect.stringMatching(/^"dir" cannot be read: EISDIR/),
      fix: "make the view a file this build can read",
    });
    const hollow = project({ "bad-ejs.ejs": "<% if (data.n) { %>" }, tmpdir());
    const fake = join(hollow, "node_modules", "@assemblejs", "renderer-templates");
    mkdirSync(fake, { recursive: true });
    writeFileSync(
      join(fake, "package.json"),
      JSON.stringify({ name: "@assemblejs/renderer-templates", exports: "./dist/index.js" }),
    );
    expect(await found(hollow)).toEqual([
      expect.objectContaining({
        path: join(hollow, "package.json"),
        rule: "a-view-needs-its-renderer",
        message: expect.stringMatching(/could not load at all: Cannot find module/),
        fix: "reinstall @assemblejs/renderer-templates",
      }),
    ]);
  });

  it("says what the engine said on one line, without its advice or its diagrams", async () => {
    const root = project({
      "bad-ejs.ejs": "<% if (data.n) { %>",
      "bad-hbs.hbs": "{{#if data.n}}never closed",
    });
    const said = (await found(root)).map((problem) => problem.message);
    expect(said.join(" ")).not.toMatch(/EJS-Lint|\n|\^/);
    expect(said.find((line) => line.includes("bad-hbs"))).toMatch(
      /Parse error on line 1: .*Expecting/,
    );
  });

  it("says nothing where the project has no templates package, which the build reports itself", async () => {
    const root = project({ "bad-ejs.ejs": "<% if (data.n) { %>" }, tmpdir());
    expect(await found(root)).toEqual([]);
    const rules = (await checkProject(root)).map((problem) => problem.rule);
    expect(rules).toContain("a-view-needs-its-renderer");
    expect(rules).not.toContain("a-template-view-compiles");
  });

  it(
    "is what check reports and build refuses, before anything is written",
    { timeout: 60_000 },
    async () => {
      const root = project({ "bad-njk.njk": "{% for x in data.list %}never closed" });
      const checked = await checkProject(root);
      expect(checked).toEqual([
        expect.objectContaining({
          path: "src/assemblies/bad-njk/bad-njk.njk",
          rule: "a-template-view-compiles",
        }),
      ]);
      const errors: string[] = [];
      expect(await buildProject(root, { ...quiet, error: (line) => errors.push(line) })).toBe(1);
      expect(errors.join()).toMatch(/does not compile as nunjucks/);
    },
  );

  // An engine says what it could not read, and would say it of a file outside the project.
  it("does not open a template view that leads out of the project, nor say anything of it", async () => {
    const outside = mkdtempSync(join(tmpdir(), "template-outside-"));
    made.push(outside);
    writeFileSync(join(outside, "secret.ejs"), "<p>SECRET-TEMPLATE <%= data.missing( %></p>");
    const root = project({ "ok-ejs.ejs": "<p><%= data.n %></p>" });
    mkdirSync(join(root, "src", "assemblies", "out"));
    symlinkSync(join(outside, "secret.ejs"), join(root, "src", "assemblies", "out", "out.ejs"));
    expect(await found(root)).toEqual([]);
    expect(JSON.stringify(await checkProject(root))).not.toContain("SECRET");
  });
});
