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

  it("refuses a url on this server outside the asset prefix, which nothing serves", () => {
    const local = defineAssembly({
      name: "local",
      views: { default: view },
      assets: { css: [], js: ["/static/app.js"] },
    });
    expect(assetProblems([local], new Map()).join()).toMatch(/where nothing serves it/);
    const elsewhere = defineAssembly({
      name: "elsewhere",
      views: { default: view },
      assets: { css: ["//cdn.example.com/a.css"], js: [] },
    });
    expect(assetProblems([elsewhere], new Map())).toEqual([]);
  });
});
