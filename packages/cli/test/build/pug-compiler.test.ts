// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PugCompiler } from "@assemblejs/cli";

describe("the one function of Pug the command line calls", () => {
  it("compiles a source, handing each plugin's postParse the tree and keeping what it answers", () => {
    const pug: PugCompiler = {
      compile: (source, options) =>
        options.plugins.reduce<unknown>((tree, plugin) => plugin.postParse(tree), { source }),
    };
    const seen: unknown[] = [];
    const plugin = {
      postParse: (tree: unknown) => {
        seen.push(tree);
        return tree;
      },
    };
    expect(pug.compile("p", { plugins: [plugin] })).toEqual({ source: "p" });
    expect(seen).toEqual([{ source: "p" }]);
  });
});
