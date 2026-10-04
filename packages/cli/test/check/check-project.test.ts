// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProject } from "@assemblejs/cli";

const project = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "check-"));
  writeFileSync(join(root, "package.json"), "{}");
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};

describe("checking a project", () => {
  it("finds nothing wrong with a project that is right", () => {
    const root = project({
      "src/server.ts": "",
      "src/assemblies/hello/hello.html": "<p>hi</p>",
      "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
    });
    expect(checkProject(root)).toEqual([]);
  });

  it("reports each finding with the file relative to the project, the rule and the fix", () => {
    const root = project({
      "src/assemblies/Cart/Cart.html": "",
      "src/assemblies/menu/menu.tsx": "",
      "src/assemblies/hello/hello.html": "",
      "src/pages/home/home.html": '<body><assembly name="nope"></assembly></body>',
      "src/pages/broken/broken.html": '<assembly nam="hello"></assembly>',
      "src/api/Bad.api.ts": "",
    });
    const findings = checkProject(root);
    const by = (rule: string) => findings.filter((finding) => finding.rule === rule);
    expect(by("directory-is-an-assembly")[0]).toMatchObject({
      path: "src/assemblies/Cart",
      fix: 'rename the directory to "cart"',
    });
    expect(by("the-file-name-says-the-framework")[0]?.path).toBe("src/assemblies/menu/menu.tsx");
    expect(
      by("a-placement-names-an-assembly")
        .map((finding) => finding.path)
        .sort(),
    ).toEqual(["src/pages/broken/broken.html", "src/pages/home/home.html"]);
    expect(
      by("a-placement-names-an-assembly").find((f) => f.path === "src/pages/home/home.html")?.fix,
    ).toBe("add it, or place one that exists: hello");
    expect(by("an-api-file-is-an-api")[0]?.path).toBe("src/api/Bad.api.ts");
  });

  it("reports what build would refuse before bundling: no server file, no Svelte compiler", () => {
    const root = project({ "src/assemblies/counter/counter.svelte": "<p>0</p>" });
    const rules = checkProject(root).map((finding) => [finding.rule, finding.path]);
    expect(rules).toContainEqual(["the-server-file-never-grows", "src/server.ts"]);
    expect(rules).toContainEqual(["a-view-needs-its-renderer", "package.json"]);
  });

  it("reads a placement its page declares from another server, against the declared remotes", () => {
    const page = (origin: string) => ({
      "src/server.ts": "",
      "src/pages/home/home.html": '<body><assembly name="cart"></assembly></body>',
      "src/pages/home/home.page.ts": `export default { place: { cart: { url: "${origin}/assembly/cart/" } } };`,
      // An origin named only in a comment is not a declared one.
      "assemblejs.config.ts":
        "// { origin: 'https://other.example.com' }\nexport default { remotes: [{ origin: 'https://shop.example.com' }] };",
    });
    expect(checkProject(project(page("https://shop.example.com")))).toEqual([]);
    // A url built at run time is not read, so it is not reported either way.
    const computed = {
      ...page("https://shop.example.com"),
      "src/pages/home/home.page.ts":
        "const base = process.env.SHOP;\nexport default { place: { cart: { url: `${base}/assembly/cart/` } } };",
    };
    expect(checkProject(project(computed))).toEqual([]);
    expect(checkProject(project(page("https://other.example.com")))).toEqual([
      expect.objectContaining({
        path: "src/pages/home/home.page.ts",
        rule: "a-placement-names-an-assembly",
        fix: 'add { origin: "https://other.example.com" } to remotes in assemblejs.config.ts',
      }),
    ]);
  });

  it("reports a page declaration it cannot read as a finding, never a throw", () => {
    const root = project({
      "src/server.ts": "",
      "src/assemblies/hello/hello.html": "<p>hi</p>",
      "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
      "src/pages/home/home.page.ts": "export default {",
    });
    expect(checkProject(root)).toEqual([
      expect.objectContaining({
        path: "src/pages/home/home.page.ts",
        message: expect.stringMatching(/could not be read/),
      }),
    ]);
  });

  it("refuses every route the server refuses at boot, each where it is declared", () => {
    for (const [route, problem] of [
      ["/items/:id", /has a parameter/],
      ["/shop/*", /wildcard/],
      ["shop", /does not start with "\/"/],
      ["/_assemblejs/x", /reserves/],
      ["/a b", /not a flat path/],
    ] as const) {
      const root = project({
        "src/server.ts": "",
        "src/assemblies/hello/hello.html": "<p>hi</p>",
        "src/pages/item/item.html": '<body><assembly name="hello"></assembly></body>',
        "src/pages/item/item.page.ts": `export default { route: ${JSON.stringify(route)} };`,
      });
      expect(checkProject(root), route).toEqual([
        expect.objectContaining({
          path: "src/pages/item/item.page.ts",
          rule: "a-directory-is-a-page",
          message: expect.stringMatching(problem),
        }),
      ]);
    }
  });

  it("refuses two pages at one route", () => {
    const root = project({
      "src/server.ts": "",
      "src/assemblies/hello/hello.html": "<p>hi</p>",
      "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
      "src/pages/start/start.html": '<body><assembly name="hello"></assembly></body>',
      "src/pages/start/start.page.ts": 'export default { route: "/" };',
    });
    expect(checkProject(root)).toEqual([
      expect.objectContaining({
        path: "src/pages/start/start.page.ts",
        rule: "a-directory-is-a-page",
        message: 'page "start" answers at /, as page "home" already does',
      }),
    ]);
  });

  it("refuses a page at the route a GET api answers", () => {
    const root = project({
      "src/server.ts": "",
      "src/assemblies/hello/hello.html": "<p>hi</p>",
      "src/pages/about/about.html": '<body><assembly name="hello"></assembly></body>',
      "src/api/about.api.ts": 'export default { path: "/about", handle: () => ({}) };',
    });
    expect(checkProject(root)).toEqual([
      expect.objectContaining({
        path: "src/pages/about/about.html",
        message: 'page "about" answers at /about, as the api src/api/about.api.ts does',
      }),
    ]);
  });

  it("refuses an api route boot refuses: twice by what the router matches, or reserved", () => {
    const root = project({
      "src/server.ts": "",
      "src/assemblies/hello/hello.html": "<p>hi</p>",
      "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
      "src/api/by-id.api.ts": 'export default { path: "/api/a/:id", handle: () => 1 };',
      "src/api/by-key.api.ts": 'export default { path: "/api/a/:key", handle: () => 1 };',
      "src/api/own.api.ts": 'export default { path: "/_assemblejs/x", handle: () => 1 };',
    });
    const found = checkProject(root).map((problem) => `${problem.path}: ${problem.message}`);
    expect(found).toHaveLength(2);
    expect(found.join("\n")).toMatch(/is declared more than once/);
    expect(found.join("\n")).toMatch(/src\/api\/own\.api\.ts: .*reserves/);
  });
});
