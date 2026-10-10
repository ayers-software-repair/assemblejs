// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverPages } from "@assemblejs/cli";

const project = (pages: Record<string, readonly string[]>): string => {
  const root = mkdtempSync(join(tmpdir(), "pages-"));
  for (const [name, files] of Object.entries(pages)) {
    mkdirSync(join(root, "src", "pages", name), { recursive: true });
    for (const file of files) writeFileSync(join(root, "src", "pages", name, file), "");
  }
  return root;
};

describe("discovering pages", () => {
  it("treats a directory as a page: home at /, anything else at its name", () => {
    const { pages, problems } = discoverPages(
      project({ home: ["home.html"], about: ["about.html", "about.page.ts"] }),
    );
    expect(problems).toEqual([]);
    expect(pages.map((page) => [page.name, page.route])).toEqual([
      ["about", "/about"],
      ["home", "/"],
    ]);
    expect(pages[0]?.declaration).toMatch(/about\/about\.page\.ts$/);
    expect(pages[1]?.declaration).toBeUndefined();
  });

  it("reports a page with no template, and a name that could never be a route", () => {
    const { pages, problems } = discoverPages(
      project({ about: ["index.html"], Bad: ["Bad.html"] }),
    );
    expect(pages).toEqual([]);
    const messages = problems.map((problem) => problem.message).join("\n");
    expect(messages).toMatch(/"about" has no template/);
    expect(messages).toMatch(/"Bad" is not a usable name/);
    expect(problems.every((problem) => problem.rule === "a-directory-is-a-page")).toBe(true);
  });

  it("is empty, not broken, for a project with no pages directory", () => {
    expect(discoverPages(join(tmpdir(), "no-such-project"))).toEqual({ pages: [], problems: [] });
  });

  // Nothing outside the project is looked at.
  it("does not list a page whose directory leads out of the project, and says so", () => {
    const outside = mkdtempSync(join(tmpdir(), "pages-outside-"));
    writeFileSync(join(outside, "landing.html"), "");
    const root = project({ home: ["home.html"] });
    symlinkSync(outside, join(root, "src", "pages", "landing"));
    const { pages, problems } = discoverPages(root);
    expect(pages.map((page) => page.name)).toEqual(["home"]);
    expect(problems).toMatchObject([
      { path: `${root}/src/pages/landing`, rule: "a-project-stays-inside-its-root" },
    ]);
  });

  it("keeps a template or a declaration that leads out by its name, and reports each", () => {
    const outside = mkdtempSync(join(tmpdir(), "pages-outside-"));
    writeFileSync(join(outside, "a.html"), "");
    writeFileSync(join(outside, "a.page.ts"), "");
    const root = project({ home: [], about: ["about.html"] });
    symlinkSync(join(outside, "a.html"), join(root, "src/pages/home/home.html"));
    symlinkSync(join(outside, "a.page.ts"), join(root, "src/pages/about/about.page.ts"));
    const { pages, problems } = discoverPages(root);
    expect(pages.map((page) => page.name)).toEqual(["about", "home"]);
    expect(problems.map((problem) => [problem.path, problem.rule])).toEqual([
      [`${root}/src/pages/about/about.page.ts`, "a-project-stays-inside-its-root"],
      [`${root}/src/pages/home/home.html`, "a-project-stays-inside-its-root"],
    ]);
  });

  it("lists nothing, and says why, where the pages themselves lead out", () => {
    const outside = mkdtempSync(join(tmpdir(), "pages-outside-"));
    mkdirSync(join(outside, "landing"));
    writeFileSync(join(outside, "landing", "landing.html"), "");
    const root = mkdtempSync(join(tmpdir(), "pages-"));
    mkdirSync(join(root, "src"));
    symlinkSync(outside, join(root, "src", "pages"));
    expect(discoverPages(root)).toMatchObject({
      pages: [],
      problems: [{ path: `${root}/src/pages`, rule: "a-project-stays-inside-its-root" }],
    });
  });
});
