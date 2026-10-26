// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addressProblems, checkProject, readAddresses } from "@asmjs/check";

const pages = [
  { name: "home", route: "/", at: "/p/src/pages/home/home.html" },
  { name: "product", route: "/p/:sku", at: "/p/src/pages/product/product.page.ts" },
];
const given = (addresses: string) => readAddresses(`export default { addresses: ${addresses} };`);

describe("the findings the addresses of a project earn", () => {
  it("is none for a project whose every page with a parameter has an address its route answers", () => {
    expect(addressProblems(pages, given('{ "/p/:sku": "/p/kettle-1" }'), "/p/config.ts")).toEqual(
      [],
    );
    expect(addressProblems(pages.slice(0, 1), given("{}"), undefined)).toEqual([]);
  });

  it("names the key to add for a page with a parameter that has no address, at the config", () => {
    expect(addressProblems(pages, given("{}"), "/p/config.ts")).toEqual([
      {
        path: "/p/config.ts",
        rule: "a-page-with-a-parameter-names-an-address",
        message:
          'page "product" has a parameter in its route /p/:sku, and addresses names none to weigh it at',
        fix: 'add "/p/:sku": "/p/example" to addresses in assemblejs.config.ts',
      },
    ]);
  });

  it("puts it at the page's own declaration when there is no config file to put it in", () => {
    const [found] = addressProblems(pages, readAddresses(""), undefined);
    expect(found?.path).toBe("/p/src/pages/product/product.page.ts");
    expect(found?.fix).toBe('add "/p/:sku": "/p/example" to addresses in assemblejs.config.ts');
  });

  it("refuses an address its route does not answer, and one that is not a path on this server", () => {
    const found = (address: string) =>
      addressProblems(pages, given(`{ "/p/:sku": ${JSON.stringify(address)} }`), "/p/config.ts");
    for (const address of [
      "/product/kettle-1",
      "p/kettle-1",
      "//elsewhere.example/p/a",
      "https://elsewhere.example/p/a",
      "/p/\\elsewhere.example",
    ]) {
      expect(found(address)).toEqual([
        {
          path: "/p/config.ts",
          rule: "a-page-with-a-parameter-names-an-address",
          message: `the address "${address}" is not a path the route /p/:sku answers`,
          fix: 'write one with a value for each parameter, such as "/p/example"',
        },
      ]);
    }
  });

  it("names an address for a route no page with a parameter has", () => {
    const found = addressProblems(
      pages,
      given('{ "/p/:sku": "/p/a", "/gone/:id": "/gone/1", "/": "/" }'),
      "/p/config.ts",
    );
    expect(found.map((problem) => problem.message)).toEqual([
      "addresses names /gone/:id, which no page with a parameter has",
      "addresses names /, which no page with a parameter has",
    ]);
  });

  it("says nothing of a stray address while a page's route is computed, or of a missing one it cannot read", () => {
    const computed = [...pages, { name: "odd", route: undefined, at: "/p/odd.page.ts" }];
    expect(
      addressProblems(computed, given('{ "/p/:sku": "/p/a", "/x/:y": "/x/1" }'), "/c"),
    ).toEqual([]);
    expect(addressProblems(pages, readAddresses("export default { ...base };"), "/c")).toEqual([]);
  });

  it("passes on what reading the addresses found wrong, at the config, and asks for nothing more", () => {
    const found = addressProblems(pages, given("{ '/p/:sku': 5 }"), "/p/config.ts");
    expect(found.map((problem) => [problem.path, problem.rule, problem.message])).toEqual([
      [
        "/p/config.ts",
        "a-page-with-a-parameter-names-an-address",
        'the address for "/p/:sku" is not written as a string; write it as a path',
      ],
    ]);
  });
});

describe("checking a project for its addresses", () => {
  const project = (files: Record<string, string>): string => {
    const root = mkdtempSync(join(tmpdir(), "addresses-"));
    writeFileSync(join(root, "package.json"), "{}");
    for (const [path, contents] of Object.entries(files)) {
      mkdirSync(join(root, path, ".."), { recursive: true });
      writeFileSync(join(root, path), contents);
    }
    return root;
  };
  const right = {
    "src/server.ts": "",
    "src/pages/item/item.html": "<p>item</p>",
    "src/pages/item/item.page.ts": 'export default { route: "/items/:sku" };',
  };

  it("asks for an address at the config, and is quiet once it is given and its route answers it", async () => {
    const none = (await checkProject(project(right))).filter(
      (found) => found.rule === "a-page-with-a-parameter-names-an-address",
    );
    expect(none.map((found) => found.path)).toEqual(["src/pages/item/item.page.ts"]);
    const config = (addresses: string) =>
      project({ ...right, "assemblejs.config.ts": `export default { addresses: ${addresses} };` });
    expect(await checkProject(config('{ "/items/:sku": "/items/kettle" }'))).toEqual([]);
    const missing = await checkProject(config("{}"));
    expect(missing.map((found) => [found.path, found.rule])).toEqual([
      ["assemblejs.config.ts", "a-page-with-a-parameter-names-an-address"],
    ]);
    const wrong = await checkProject(config('{ "/items/:sku": "/item/kettle" }'));
    expect(wrong.map((found) => found.rule)).toEqual(["a-page-with-a-parameter-names-an-address"]);
    const stray = await checkProject(
      config('{ "/items/:sku": "/items/kettle", "/old/:id": "/old/1" }'),
    );
    expect(stray.map((found) => found.message)).toEqual([
      "addresses names /old/:id, which no page with a parameter has",
    ]);
  });
});
