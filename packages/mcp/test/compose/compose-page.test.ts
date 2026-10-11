// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { composePage, resolveRoot } from "@assemblejs/mcp";
import type { ProjectRoot } from "@assemblejs/mcp";

let root: ProjectRoot;
let dir = "";
const file = (path: string, contents: string): void => {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), contents);
};
const assembly = (name: string, markup: string): void =>
  file(`src/assemblies/${name}/${name}.html`, markup);
const page = (name: string, template: string, declaration?: string): void => {
  file(`src/pages/${name}/${name}.html`, template);
  if (declaration !== undefined) file(`src/pages/${name}/${name}.page.ts`, declaration);
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-page-"));
  root = resolveRoot(dir);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("composing a page by its name", () => {
  it("composes the page's own template, so the agent sees the page it made", async () => {
    assembly("header", "<h1>Shop</h1>");
    page("home", '<main><assembly name="header"></assembly></main>');
    const composed = await composePage(root, "home");
    expect(composed.problems).toEqual([]);
    expect(composed.html).toContain("<h1>Shop</h1>");
    expect(composed.diagnostics.map((d) => [d.name, d.source])).toEqual([["header", "local"]]);
  });

  it("composes under the policy the page's declaration writes: a fallback where a placement fails", async () => {
    page(
      "home",
      '<main><assembly name="missing"></assembly></main>',
      'export default { place: { missing: { fallback: "<p>soon</p>" } } };',
    );
    const composed = await composePage(root, "home");
    expect(composed.html).toContain("<p>soon</p>");
    expect(composed.diagnostics[0]?.source).toBe("fallback");
    expect(composed.problems.join()).toContain("missing");
  });

  it("composes a placement from another server deferred, reaching no network", async () => {
    page(
      "home",
      '<main><assembly name="cart"></assembly></main>',
      'export default { place: { cart: { url: "https://shop.example.com/assembly/cart/" } } };',
    );
    const composed = await composePage(root, "home");
    expect(composed.problems).toEqual([]);
    expect(composed.diagnostics.map((d) => d.source)).toEqual(["deferred"]);
    expect(composed.html).toContain("data-defer");
  });

  it("answers a page the project has not, and a declaration it cannot read, as problems", async () => {
    expect((await composePage(root, "nowhere")).problems.join()).toContain('no page "nowhere"');
    page("home", "<main></main>", "export default { route: ");
    const unread = await composePage(root, "home");
    expect(unread.html).toBe("");
    expect(unread.problems.join()).toContain('page "home" could not be read');
  });

  it("composes a page with no placements unchanged", async () => {
    page("home", "<main><p>static</p></main>");
    const composed = await composePage(root, "home");
    expect(composed.html).toBe("<main><p>static</p></main>");
    expect(composed.diagnostics).toEqual([]);
  });
});
