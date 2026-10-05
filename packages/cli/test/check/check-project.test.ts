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
    "assemblejs.config.ts": "export default { remotes: [{ origin: 'https://s.example' }] };",
  };
  // A framework view here has no renderer installed, which build reports on its own.
  const still = {
    "src/assemblies/still/still.react.tsx": 'export const mount = "none";\nexport default () => 0;',
    "src/assemblies/wake/wake.react.tsx": "export default () => 0;",
  };
  const FAR = "https://s.example/assembly/far/";
  const one = (name: string, view?: string) =>
    `<assembly name="${name}"${view === undefined ? "" : ` view="${view}"`}></assembly>`;
  const place = (policy: string) => `export default { place: { ${policy} } };`;
  const page = (template: string, declaration?: string, files: Record<string, string> = hello) =>
    checkProject(
      project({
        "src/server.ts": "",
        "src/pages/home/home.html": `<body>${template}</body>`,
        ...(declaration === undefined ? {} : { "src/pages/home/home.page.ts": declaration }),
        ...files,
      }),
    ).filter((finding) => finding.rule !== "a-view-needs-its-renderer");
  const said = (template: string, declaration?: string, files?: Record<string, string>) =>
    page(template, declaration, files)
      .map((finding) => finding.message)
      .join();

  it("reports a view the assembly lacks in the template, and policy where it is declared", () => {
    expect(page(one("hello", "wide"))).toEqual([
      expect.objectContaining({
        path: "src/pages/home/home.html",
        rule: "a-placement-names-an-assembly",
        message: expect.stringMatching(/view "wide" it does not have/),
      }),
    ]);
    const findings = page(one("hello"), place('stale: {}, hello: "soon"'));
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

  it("refuses what boot refuses, by the same rules, and passes what boot passes", () => {
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
      [
        one("far"),
        place('far: { url: "https://s.example/far" }'),
        shop,
        /not an assembly's content/,
      ],
      [`<form>${one("far")}</form>`, place(`far: { url: "${FAR}" }`), shop, /inside a <form>/],
      [one("far"), place(`far: { url: "${FAR}" }`), shop, /^$/],
      // A framework view declared never to mount puts no runtime on the page; one not declared does.
      [one("still"), place("still: { defer: true }"), still, /nothing would fill it/],
      [one("still") + one("wake"), place("still: { defer: true }"), still, /^$/],
    ] as const) {
      expect(said(template, declaration, files), declaration).toMatch(expected);
    }
  });

  it("reads nothing it cannot read: a computed policy, deadline or flag is not reported either way", () => {
    const computed =
      "const ms = Number(process.env.MS);\nconst flag = process.env.D === '1';\nexport default { place: { hello: { deadline: ms, defer: flag }, other: policy() } };\nfunction policy() { return {}; }";
    expect(page(one("hello"), computed)).toEqual([]);
  });

  it("holds the stream a page names to a streaming api without parameters, on a page with a runtime", () => {
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
      expect(said(template, declaration, both), declaration).toMatch(expected);
    }
    const [finding] = page(one("hello"), stream('"/api/time"'), { ...hello, ...apis });
    expect(finding).toMatchObject({
      path: "src/pages/home/home.page.ts",
      rule: "a-page-opens-one-stream",
      fix: expect.stringMatching(/streaming api/),
    });
  });
});
