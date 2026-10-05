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
  const right = {
    "src/server.ts": "",
    "src/assemblies/hello/hello.html": "<p>hi</p>",
    "src/pages/home/home.html": '<body><assembly name="hello"></assembly></body>',
  };

  it("finds nothing wrong with a project that is right", async () => {
    expect(await checkProject(project(right))).toEqual([]);
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
    expect(await checkProject(project(page("https://other.example.com")))).toEqual([
      expect.objectContaining({
        path: "src/pages/home/home.page.ts",
        rule: "a-placement-names-an-assembly",
        fix: 'add { origin: "https://other.example.com" } to remotes in assemblejs.config.ts',
      }),
    ]);
  });

  it("reports a file it cannot read, a page declaration or the config, as one finding", async () => {
    const root = project({ ...right, "src/pages/home/home.page.ts": "export default {" });
    expect(await checkProject(root)).toEqual([
      expect.objectContaining({
        path: "src/pages/home/home.page.ts",
        message: expect.stringMatching(/could not be read/),
      }),
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

describe("reading placement policy as boot does", () => {
  const hello = { "src/assemblies/hello/hello.html": "<p>hi</p>" };
  const live = {
    "src/assemblies/live/live.html": "<p>live</p>",
    "src/assemblies/live/live.client.ts": "export default { mount: () => ({ unmount: () => 0 }) };",
  };
  const apis = {
    "src/api/ticks.api.ts": 'export default { path: "/api/ticks", stream: () => undefined };',
    "src/api/time.api.ts": 'export default { path: "/api/time", handle: () => null };',
  };
  const shop = {
    "assemblejs.config.ts": "export default { remotes: [{ origin: 'https://s.ex' }] };",
  };
  // A framework view here has no renderer installed, which build reports on its own.
  const still = {
    "src/assemblies/still/still.react.tsx": 'export const mount = "none";\nexport default () => 0;',
    "src/assemblies/wake/wake.react.tsx": "export default () => 0;",
  };
  const FAR = "https://s.ex/assembly/far/";
  const one = (name: string, view?: string) =>
    `<assembly name="${name}"${view === undefined ? "" : ` view="${view}"`}></assembly>`;
  const place = (policy: string) => `export default { place: { ${policy} } };`;
  const page = async (
    template: string,
    declaration?: string,
    files: Record<string, string> = hello,
  ) =>
    (
      await checkProject(
        project({
          "src/server.ts": "",
          "src/pages/home/home.html": `<body>${template}</body>`,
          ...(declaration === undefined ? {} : { "src/pages/home/home.page.ts": declaration }),
          ...files,
        }),
      )
    ).filter((finding) => finding.rule !== "a-view-needs-its-renderer");
  const said = async (template: string, declaration?: string, files?: Record<string, string>) =>
    (await page(template, declaration, files)).map((finding) => finding.message).join();

  it("reports a view the assembly lacks in the template, and policy where it is declared", async () => {
    expect(await page(one("hello", "wide"))).toEqual([
      expect.objectContaining({
        path: "src/pages/home/home.html",
        rule: "a-placement-names-an-assembly",
        message: expect.stringMatching(/view "wide" it does not have/),
      }),
    ]);
    const findings = await page(one("hello"), place('stale: {}, hello: "soon"'));
    expect(findings).toHaveLength(2);
    for (const finding of findings) {
      expect(finding).toMatchObject({
        path: "src/pages/home/home.page.ts",
        rule: "policy-names-a-placement",
        fix: expect.stringMatching(/a name the template places/),
      });
    }
    expect(findings.map((f) => f.message).join()).toMatch(/never places.*not an object/);
  });

  it("refuses what boot refuses, by the same rules, and passes what boot passes", async () => {
    for (const [template, declaration, files, expected] of [
      [
        one("hello"),
        place("hello: { defer: true, required: true }"),
        hello,
        /both deferred and required/,
      ],
      [one("hello"), place("hello: { defer: true }"), hello, /nothing would fill it/],
      [one("hello") + one("live"), place("hello: { defer: true }"), { ...hello, ...live }, /^$/],
      [one("live"), place("live: { defer: true, deadline: 500 }"), live, /nothing reads/],
      [one("hello"), place("hello: { deadline: 0 }"), hello, /positive, finite/],
      [one("hello"), place("hello: { deadline: -1 }"), hello, /positive, finite/],
      [one("hello"), place("hello: { deadline: 1500 }"), hello, /^$/],
      [one("hello"), place("hello: null"), hello, /not an object/],
      [one("far"), place(`far: { defer: true, url: "${FAR}" }`), shop, /across origins/],
      [one("far"), place("far: { defer: true, url: process.env.FAR }"), shop, /across origins/],
      [one("far"), place('far: { url: "https://s.ex/far" }'), shop, /not an assembly's content/],
      [`<form>${one("far")}</form>`, place(`far: { url: "${FAR}" }`), shop, /inside a <form>/],
      [one("far"), place(`far: { url: "${FAR}" }`), shop, /^$/],
      // A framework view declared never to mount puts no runtime on the page; one not declared does.
      [one("still"), place("still: { defer: true }"), still, /nothing would fill it/],
      [one("still") + one("wake"), place("still: { defer: true }"), still, /^$/],
    ] as const) {
      expect(await said(template, declaration, files), declaration).toMatch(expected);
    }
  });

  it("reports a budget perf could not read, where it is declared, without building", async () => {
    const [finding] = await page(one("hello"), undefined, {
      ...hello,
      "assemblejs.config.ts": "export default { budgets: { document: 0 } };",
    });
    expect(finding).toMatchObject({
      path: "assemblejs.config.ts",
      rule: "a-budget-is-whole-bytes",
      message: expect.stringMatching(/document is not a whole number/),
    });
  });

  it("reads nothing it cannot read: a computed policy, deadline or flag is not reported either way", async () => {
    const computed =
      "const ms = Number(process.env.MS);\nconst flag = process.env.D === '1';\nexport default { place: { hello: { deadline: ms, defer: flag }, other: policy() } };\nfunction policy() { return {}; }";
    expect(await page(one("hello"), computed)).toEqual([]);
  });

  it("holds the stream a page names to a streaming api without parameters, on a page with a runtime", async () => {
    const both = { ...hello, ...live, ...apis };
    const stream = (path: string) => `export default { stream: ${path} };`;
    for (const [template, declaration, expected] of [
      [one("hello") + one("live"), stream('"/api/ticks"'), /^$/],
      [one("hello") + one("live"), stream('"/api/time"'), /not the path of a streaming api/],
      [one("hello"), stream('"/api/ticks"'), /nothing would open it/],
      [one("hello") + one("live"), stream("process.env.S"), /^$/],
      // A template that cannot be read: the path is still held, what would open it is not.
      ['<assembly nam="x"></assembly>', stream('"/nowhere"'), /streaming api(?!.*would open)/],
    ] as const) {
      expect(await said(template, declaration, both), declaration).toMatch(expected);
    }
    const [finding] = await page(one("hello"), stream('"/api/time"'), { ...hello, ...apis });
    expect(finding).toMatchObject({
      path: "src/pages/home/home.page.ts",
      rule: "a-page-opens-one-stream",
      fix: expect.stringMatching(/streaming api/),
    });
  });
});
