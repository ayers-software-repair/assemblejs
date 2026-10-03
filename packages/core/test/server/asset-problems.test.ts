// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { assetProblems, defineAssembly } from "@assemblejs/core";

const view = { renderer: "react", markup: () => "" };

describe("what is checked about browser files before anything listens", () => {
  it("refuses an asset under this server's prefix that the build did not write", () => {
    const counter = defineAssembly({
      name: "counter",
      views: { default: view },
      assets: { css: [], js: ["/_assemblejs/assets/client-1a2b.js"] },
    });
    expect(assetProblems([counter], new Map()).join()).toMatch(/did not write/);
    expect(
      assetProblems(
        [counter],
        new Map([["/_assemblejs/assets/client-1a2b.js", "/x/client-1a2b.js"]]),
      ),
    ).toEqual([]);
  });

  it("leaves a url on another origin to that origin", () => {
    const remote = defineAssembly({
      name: "remote",
      views: { default: view },
      assets: { css: ["https://cdn.example.com/a.css"], js: [] },
    });
    expect(assetProblems([remote], new Map())).toEqual([]);
  });
});
