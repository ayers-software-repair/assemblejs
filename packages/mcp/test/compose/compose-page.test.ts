// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { composePage, resolveRoot } from "@assemblejs/mcp";
import type { ProjectRoot } from "@assemblejs/mcp";
import { devServer } from "../fixtures/dev-server.js";

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

const dev = devServer();

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

// A page with a parameter in its route was composed as for nobody: its services were given no
// value, so the agent was shown a page no visitor is.
describe("composing a page for the visitor a call describes", () => {
  const PRODUCT = 'export default { route: "/p/:sku" };';

  it("gives the route's parameters and the query to every placement's request, as the server does", async () => {
    assembly("asked", "<p>on disk</p>");
    page("product", '<main><assembly name="asked"></assembly></main>', PRODUCT);
    dev.runningFor(dir);
    const composed = await composePage(root, "product", {
      params: { sku: "kb-250" },
      query: { grind: "espresso" },
    });
    expect(composed.problems).toEqual([]);
    // What the server's own run of the service returned, in the island its envelope carries.
    expect(composed.html).toContain('"params":{"sku":"kb-250"}');
    expect(composed.html).toContain('"query":{"grind":"espresso"}');
  });

  it("composes without a value for a parameter, and says a visitor always has one", async () => {
    assembly("header", "<h1>Shop</h1>");
    page("product", '<main><assembly name="header"></assembly></main>', PRODUCT);
    const composed = await composePage(root, "product");
    expect(composed.html).toContain("<h1>Shop</h1>");
    expect(composed.problems).toEqual([
      "the route /p/:sku was composed with no value for sku: a visitor always arrives with one, so give each in params to see the page one is shown",
    ]);
  });

  it("refuses a value for a parameter the route has not, naming the ones it has", async () => {
    assembly("header", "<h1>Shop</h1>");
    page("product", '<main><assembly name="header"></assembly></main>', PRODUCT);
    page("about", '<main><assembly name="header"></assembly></main>');
    expect(await composePage(root, "product", { params: { id: "1" } })).toEqual({
      html: "",
      diagnostics: [],
      problems: ['the route /p/:sku has no parameter "id": it has sku'],
    });
    expect((await composePage(root, "about", { params: { id: "1" } })).problems).toEqual([
      'the route /about has no parameter "id": it has none',
    ]);
  });

  it("holds a page to no parameters where its file computes its route", async () => {
    assembly("header", "<h1>Shop</h1>");
    page(
      "product",
      '<main><assembly name="header"></assembly></main>',
      'const at = "/p/:sku"; export default { route: at + "" };',
    );
    const composed = await composePage(root, "product", { params: { anything: "1" } });
    expect(composed.problems).toEqual([]);
    expect(composed.html).toContain("<h1>Shop</h1>");
  });
});
