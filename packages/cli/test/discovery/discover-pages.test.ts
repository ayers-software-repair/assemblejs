// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverPages } from "@assemblejs/cli";

const project = (pages: Record<string, readonly string[]>): string => {
  const root = join(mkdtempSync(join(tmpdir(), "pages-")), "pages");
  for (const [name, files] of Object.entries(pages)) {
    mkdirSync(join(root, name), { recursive: true });
    for (const file of files) writeFileSync(join(root, name, file), "");
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
    expect(discoverPages(join(tmpdir(), "no-such-pages-dir"))).toEqual({ pages: [], problems: [] });
  });
});
