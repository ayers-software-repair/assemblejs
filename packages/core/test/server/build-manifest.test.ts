// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { buildManifest, defineAssembly } from "@assemblejs/core";

const cart = defineAssembly({
  name: "cart",
  views: {
    default: { renderer: "svelte", data: () => ({}), markup: () => "" },
    compact: { renderer: "svelte", data: () => ({}), markup: () => "" },
  },
});

describe("building a manifest", () => {
  it("names every field that goes in", () => {
    expect(buildManifest(cart, "default", "9f2c1a")).toEqual({
      contract: 1,
      name: "cart",
      view: "default",
      version: "9f2c1a",
      views: ["default", "compact"],
      renderer: "svelte",
      assets: { css: [], js: [] },
      public: true,
    });
  });

  // The predecessor built its manifest by removing three fields and shipping the rest, which
  // leaks by default every time the internal object grows. This one cannot.
  it("carries nothing of the assembly beyond those fields", () => {
    const wide = {
      ...cart,
      secret: "do not ship me",
      views: {
        default: {
          renderer: "svelte",
          data: () => ({ token: "secret" }),
          markup: () => "",
        },
      },
    };
    const serialised = JSON.stringify(buildManifest(wide, "default", "v"));
    expect(serialised).not.toContain("do not ship me");
    expect(serialised).not.toContain("secret");
    expect(serialised).not.toContain("function");
  });

  it("refuses a view the assembly does not have", () => {
    expect(() => buildManifest(cart, "nope", "v")).toThrow(/has no view "nope"/);
  });
});
