// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { checkProject } from "@asmjs/check";
import { templatedProject } from "../../../build/test/fixtures/templated-project.js";

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
  const right = {
    "src/server.ts": "",
    "src/assemblies/hello/hello.html": "<p>hi</p>",
    "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
  };

  it("finds nothing wrong with a project that is right, until a sheet sets a colour of its own", async () => {
    expect(await checkProject(project(right))).toEqual([]);
    const sheet = { "src/assemblies/hello/hello.css": "p{color:red}", "src/tokens.css": ":root{}" };
    const found = await checkProject(project({ ...right, ...sheet }));
    expect(found.map((f) => f.rule)).toEqual(["a-colour-is-a-token"]);
  });

  it("reports each finding with the file relative to the project, the rule and the fix", async () => {
    const root = project({
      "src/assemblies/Cart/Cart.html": "",
      "src/assemblies/menu/menu.tsx": "",
      "src/assemblies/hello/hello.html": "",
      "src/pages/home/home.html": '<body><assembly name="nope"></assembly></body>',
      "src/pages/broken/broken.html": '<assembly nam="hello"></assembly>',
      "src/api/Bad.api.ts": "",
    });
    const findings = await checkProject(root);
    const by = (rule: string) => findings.filter((finding) => finding.rule === rule);
    expect(by("directory-is-an-assembly")[0]).toMatchObject({
      path: "src/assemblies/Cart",
      fix: 'rename the directory to "cart"',
    });
    expect(by("the-file-name-says-the-framework")[0]?.path).toBe("src/assemblies/menu/menu.tsx");
    const placements = by("a-placement-names-an-assembly");
    expect(placements.map((finding) => finding.path).sort()).toEqual([
      "src/pages/broken/broken.html",
      "src/pages/home/home.html",
    ]);
    expect(placements.find((f) => f.path === "src/pages/home/home.html")?.fix).toBe(
      "add it, or place one that exists: hello",
    );
    expect(by("an-api-file-is-an-api")[0]?.path).toBe("src/api/Bad.api.ts");
  });

  it("reports what build would refuse before bundling: no server file, no Svelte compiler", async () => {
    const root = project({ "src/assemblies/counter/counter.svelte": "<p>0</p>" });
    const rules = (await checkProject(root)).map((finding) => [finding.rule, finding.path]);
    expect(rules).toContainEqual(["the-server-file-never-grows", "src/server.ts"]);
    expect(rules).toContainEqual(["a-view-needs-its-renderer", "package.json"]);
  });

  it("reads a placement its page declares from another server, against the declared remotes", async () => {
    const page = (origin: string) => ({
      "src/server.ts": "",
      "src/pages/home/home.html": '<body><assembly name="cart"></assembly></body>',
      "src/pages/home/home.page.ts": `export default { place: { cart: { url: "${origin}/assembly/cart/" } } };`,
      // An origin named only in a comment is not a declared one.
      "assemblejs.config.ts":
        "// { origin: 'https://other.example.com' }\nexport default { remotes: [{ origin: 'https://shop.example.com' }] };",
    });
    expect(await checkProject(project(page("https://shop.example.com")))).toEqual([]);
    // A url built at run time is not read, so it is not reported either way.
    const computed = {
      ...page("https://shop.example.com"),
      "src/pages/home/home.page.ts":
        "const base = process.env.SHOP;\nexport default { place: { cart: { url: `${base}/assembly/cart/` } } };",
    };
    expect(await checkProject(project(computed))).toEqual([]);
    const other = await checkProject(project(page("https://other.example.com")));
    expect(other.map((f) => [f.path, f.rule, f.fix])).toEqual([
      [
        "src/pages/home/home.page.ts",
        "a-placement-names-an-assembly",
        'add { origin: "https://other.example.com" } to remotes in assemblejs.config.ts',
      ],
    ]);
  });

  it("reports a file it cannot read, a page declaration or the config, as one finding", async () => {
    const root = project({ ...right, "src/pages/home/home.page.ts": "export default {" });
    expect((await checkProject(root)).map((f) => [f.path, f.message])).toEqual([
      ["src/pages/home/home.page.ts", expect.stringMatching(/could not be read/)],
    ]);
    const config = project({ ...right, "assemblejs.config.ts": "export default {" });
    expect((await checkProject(config)).map((f) => f.path)).toEqual(["assemblejs.config.ts"]);
  });

  it("refuses every route the server refuses at boot, each where it is declared", async () => {
    for (const [route, problem] of [
      ["/shop/*", /wildcard/],
      ["shop", /does not start with "\/"/],
      ["/_assemblejs/x", /reserves/],
      ["/a b", /not a flat path/],
    ] as const) {
      const root = project({
        ...right,
        "src/pages/item/item.html": '<body><assembly name="hello"></assembly></body>',
        "src/pages/item/item.page.ts": `export default { route: ${JSON.stringify(route)} };`,
      });
      expect(await checkProject(root), route).toEqual([
        expect.objectContaining({
          path: "src/pages/item/item.page.ts",
          rule: "a-directory-is-a-page",
          message: expect.stringMatching(problem),
        }),
      ]);
    }
  });

  it("refuses two pages at one route, as the router matches it: a parameter's name is not a route", async () => {
    const at = (home: string, start: string) =>
      project({
        ...right,
        "src/pages/home/home.page.ts": `export default { ${home} };`,
        "src/pages/start/start.html": '<body><assembly name="hello"></assembly></body>',
        "src/pages/start/start.page.ts": `export default { route: "${start}" };`,
        // A route with a parameter is given the address it is weighed at.
        ...(home === ""
          ? {}
          : {
              "assemblejs.config.ts":
                'export default { addresses: { "/items/:a": "/items/1", "/items/:b": "/items/1" } };',
            }),
      });
    for (const [home, start] of [
      ["", "/"],
      ['route: "/items/:a"', "/items/:b"],
    ] as const) {
      expect(await checkProject(at(home, start))).toEqual([
        expect.objectContaining({
          path: "src/pages/start/start.page.ts",
          rule: "a-directory-is-a-page",
          message: `page "start" answers at ${start}, as page "home" already does`,
        }),
      ]);
    }
  });

  it("refuses a page at the route a GET api answers", async () => {
    const root = project({
      ...right,
      "src/pages/about/about.html": '<body><assembly name="hello"></assembly></body>',
      "src/api/about.api.ts": 'export default { path: "/about", handle: () => ({}) };',
    });
    const found = await checkProject(root);
    expect(found.map((f) => f.path)).toEqual(["src/pages/about/about.html"]);
    expect(found[0]?.message).toBe(
      'page "about" answers at /about, as the api src/api/about.api.ts does',
    );
  });

  it("refuses an api route boot refuses: twice by what the router matches, or reserved", async () => {
    const root = project({
      ...right,
      "src/api/by-id.api.ts": 'export default { path: "/api/a/:id", handle: () => 1 };',
      "src/api/by-key.api.ts": 'export default { path: "/api/a/:key", handle: () => 1 };',
      "src/api/own.api.ts": 'export default { path: "/_assemblejs/x", handle: () => 1 };',
    });
    const found = (await checkProject(root)).map((p) => `${p.path}: ${p.message}`).join("\n");
    expect(found.split("\n")).toHaveLength(2);
    expect(found).toMatch(/is declared more than once/);
    expect(found).toMatch(/src\/api\/own\.api\.ts: .*reserves/);
  });
});

// The example that installs Svelte and Vue: a project nested in it finds their compilers.
const FRAMEWORKS = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
const made: string[] = [];
afterAll(() => {
  for (const root of made) rmSync(root, { recursive: true, force: true });
});
// Each view in an assembly named for its file, in a project that would build: beneath the
// example that installs the templates package, or wherever else it is told to stand.
const viewed = (views: Record<string, string>, at?: string): string =>
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
const rulesOf = async (root: string): Promise<string[]> =>
  (await checkProject(root)).map((problem) => problem.rule);

// Each of these check once answered clean, of a project the build then refused.
describe("a view the build would refuse, said by check", { timeout: 60_000 }, () => {
  it("is a Svelte view its own compiler cannot read", async () => {
    const root = viewed({ "bad-board.svelte": "<p>{</p>\n" }, FRAMEWORKS);
    expect(await rulesOf(root)).toContain("a-template-view-compiles");
  });

  it("is the missing compiler and no more, where the project has none", async () => {
    const rules = await rulesOf(viewed({ "bad-board.svelte": "<p>{</p>\n" }, tmpdir()));
    expect(rules).toContain("a-view-needs-its-renderer");
    expect(rules).not.toContain("a-template-view-compiles");
  });

  it("is the missing templates package and no more, where the project has none", async () => {
    const rules = await rulesOf(viewed({ "bad-ejs.ejs": "<% if (data.n) { %>" }, tmpdir()));
    expect(rules).toContain("a-view-needs-its-renderer");
    expect(rules).not.toContain("a-template-view-compiles");
  });

  it("is a template its engine cannot read, and that one finding alone", async () => {
    const root = viewed({ "bad-njk.njk": "{% for x in data.list %}never closed" });
    expect(await checkProject(root)).toEqual([
      expect.objectContaining({
        path: "src/assemblies/bad-njk/bad-njk.njk",
        rule: "a-template-view-compiles",
      }),
    ]);
  });

  // An engine says what it could not read, and would say it of a file outside the project.
  it("says nothing of a template view that leads out of the project", async () => {
    const outside = mkdtempSync(join(tmpdir(), "template-outside-"));
    made.push(outside);
    writeFileSync(join(outside, "secret.ejs"), "<p>SECRET-TEMPLATE <%= data.missing( %></p>");
    const root = viewed({ "ok-ejs.ejs": "<p><%= data.n %></p>" });
    mkdirSync(join(root, "src", "assemblies", "out"));
    symlinkSync(join(outside, "secret.ejs"), join(root, "src", "assemblies", "out", "out.ejs"));
    expect(JSON.stringify(await checkProject(root))).not.toContain("SECRET");
  });
});

// Each of these was passed over: check said no problems of a file the build then stopped on.
describe("a file that does not compile, said by check", () => {
  const written = (files: Readonly<Record<string, string>>): string => {
    const root = mkdtempSync(join(tmpdir(), "unreadable-"));
    for (const [path, contents] of Object.entries({ "package.json": "{}", ...files })) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), contents);
    }
    return root;
  };
  const found = async (files: Readonly<Record<string, string>>) =>
    (await checkProject(written(files)))
      .filter((problem) => problem.rule === "a-source-file-compiles")
      .map((problem) => [problem.path, problem.message.split(":")[0]]);

  it("is a finding where it is an api", async () => {
    expect(
      await found({
        "src/api/broken.api.ts": 'export default defineApi({ path: "/api/x", handle: (',
      }),
    ).toEqual([["src/api/broken.api.ts", "broken.api.ts does not compile"]]);
  });

  it("is a finding where it is a view written as a module, or a component of one", async () => {
    expect(
      await found({
        "src/assemblies/photo/photo.react.tsx":
          'export default function Photo() {\n  return <figure><img alt="x" /></figcaption>;\n}\n',
        "src/assemblies/cart/cart.preact.tsx":
          'import { Row } from "./row.js";\nexport default () => <ul><Row /></ul>;\n',
        "src/assemblies/cart/row.tsx": "export const Row = () => <li>;\n",
      }),
    ).toEqual([
      ["src/assemblies/cart/row.tsx", "row.tsx does not compile"],
      ["src/assemblies/photo/photo.react.tsx", "photo.react.tsx does not compile"],
    ]);
  });

  it("is none where every file compiles", async () => {
    expect(
      await found({
        "src/api/time.api.ts": 'export default { path: "/api/time", handle: () => ({}) };',
        "src/assemblies/photo/photo.react.tsx": "export default () => <p>photo</p>;",
      }),
    ).toEqual([]);
  });
});
