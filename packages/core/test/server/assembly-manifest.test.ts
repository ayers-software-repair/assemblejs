// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyManifest } from "@assemblejs/core";

describe("the manifest", () => {
  it("separates the specification's version from this assembly's output version", () => {
    const manifest: AssemblyManifest = {
      contract: 1,
      name: "cart",
      view: "default",
      version: "9f2c1a",
      views: ["default"],
      renderer: "html",
      assets: { css: [], js: [] },
      public: true,
    };
    expect(manifest.contract).not.toBe(manifest.version);
  });
});
