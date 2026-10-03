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

  it("reports the browser files the assembly declared", () => {
    const withAssets = defineAssembly({
      ...cart,
      assets: { css: ["/_assemblejs/assets/cart.css"], js: ["/_assemblejs/assets/client.js"] },
    });
    const reported = buildManifest(withAssets, "default", "1").assets;
    expect(reported).toEqual({
      css: ["/_assemblejs/assets/cart.css"],
      js: ["/_assemblejs/assets/client.js"],
    });
    // Copied, never the assembly's own arrays, so nothing holding a manifest can change them.
    expect(reported.js).not.toBe(withAssets.assets?.js);
    expect(reported.css).not.toBe(withAssets.assets?.css);
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

  it("lists no page styles for an assembly in its own shadow root, which links them there", () => {
    const isolated = defineAssembly({
      ...cart,
      shadow: true,
      assets: { css: ["/s/cart.shadow.css"], js: ["/c.js"] },
    });
    expect(buildManifest(isolated, "default", "1").assets).toEqual({ css: [], js: ["/c.js"] });
  });

  it("refuses a view the assembly does not have", () => {
    expect(() => buildManifest(cart, "nope", "v")).toThrow(/has no view "nope"/);
  });
});
