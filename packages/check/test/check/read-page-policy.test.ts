// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProject, readPagePolicy } from "@asmjs/check";

describe("reading a page's policy from its declaration", () => {
  it("names each placement from another server, with the url when it is a literal", async () => {
    const source = `const link = { cart: { url: "https://elsewhere.example/" } };
    export default definePage({
      place: {
        cart: { retry: { attempts: 2 }, url: "https://shop.example.com/assembly/cart/", deadline: 800 },
        "mini-cart": { deadline: 100, url: 'https://shop.example.com/assembly/mini/' },
        search: { url: base + "/assembly/search/" },
        // done: { url: "https://commented.example/assembly/done/" },
        local: { deadline: 300 },
      },
    });`;
    expect([...(await readPagePolicy(source)).remote]).toEqual([
      ["cart", "https://shop.example.com/assembly/cart/"],
      ["mini-cart", "https://shop.example.com/assembly/mini/"],
      ["search", undefined],
    ]);
  });

  it("reads each policy as written, a computed value left out, a computed url kept as a mark", async () => {
    // Inside a nested object a computed value stays as it is: the rules read only that the cache
    // is there. What is written is kept whole: a null, a negated number, an array of policies.
    const source = `export default definePage({
      place: {
        cart: { deadline: 800, defer: true, cache: { ttl: ms }, required: flag },
        search: { url: base + "/assembly/search/", defer: true },
        soon: policy(),
        odd: "not an object",
        none: null,
        late: { deadline: -1 },
      },
    });`;
    expect((await readPagePolicy(source)).place).toStrictEqual({
      cart: { deadline: 800, defer: true, cache: { ttl: undefined } },
      search: { url: "(computed)", defer: true },
      odd: "not an object",
      none: null,
      late: { deadline: -1 },
    });
    expect(
      (await readPagePolicy("export default { place: [{ defer: true }] };")).place,
    ).toStrictEqual({
      "0": { defer: true },
    });
  });

  it("reads the stream when it is written, and no policy from a declaration that is not an object", async () => {
    expect(
      (await readPagePolicy('export default definePage({ stream: "/api/ticks" });')).stream,
    ).toBe("/api/ticks");
    expect(
      (await readPagePolicy("export default definePage({ stream: process.env.S });")).stream,
    ).toBe(undefined);
    expect(await readPagePolicy("export default page();")).toEqual({
      place: {},
      remote: new Map(),
      stream: undefined,
    });
  });

  it("throws for a declaration that cannot be compiled, for the caller to report", async () => {
    await expect(readPagePolicy("export default {")).rejects.toThrow();
  });
});

const project = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "check-"));
  writeFileSync(join(root, "package.json"), "{}");
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};

// Through check, which is what holds a project to its policy before a build does.
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
    )
      // A project standing in a temporary directory has installed no renderer and no types.
      .filter(
        (finding) =>
          !["a-view-needs-its-renderer", "a-react-view-needs-its-types"].includes(finding.rule),
      );
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
