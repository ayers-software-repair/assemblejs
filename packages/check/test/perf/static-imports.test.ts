// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { staticImports } from "@assemblejs/check";

describe("what a module imports before it runs", () => {
  it("is every specifier it imports or exports from, in the order written", () => {
    expect(
      staticImports(
        'import a from "./a.js";\nimport "./b.js";\nimport * as c from "/c.js";\n' +
          'export * from "./d.js";\nexport { e } from "./e.js";\nexport * as f from "./f.js";\n' +
          "export const own = a + c;",
      ),
    ).toEqual(["./a.js", "./b.js", "/c.js", "./d.js", "./e.js", "./f.js"]);
  });

  it("is as a bundler writes them, with nothing between the words", () => {
    expect(
      staticImports('import{a as b}from"./chunk-K2.js";import"./chunk-9Z.js";export{b}'),
    ).toEqual(["./chunk-K2.js", "./chunk-9Z.js"]);
  });

  // What it asks for when something runs is loaded then, and is no part of what loads first.
  it("is not what it imports later, nor an import written in a string or a comment", () => {
    expect(
      staticImports(
        'const later = () => import("./lazy.js");\nconst text = \'import "./never.js"\';\n' +
          '// import "./commented.js";\nexport { later, text };',
      ),
    ).toEqual([]);
  });

  it("is nothing for a source that is not a module a browser could read", () => {
    expect(staticImports("this is ( not javascript")).toEqual([]);
    expect(staticImports("")).toEqual([]);
  });
});
