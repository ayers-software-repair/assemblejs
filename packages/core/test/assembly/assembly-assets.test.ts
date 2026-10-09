// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyAssets } from "@assemblejs/core";

describe("an assembly's browser files", () => {
  it("are stylesheets and modules, as urls", () => {
    const assets: AssemblyAssets = { css: [], js: ["/_assemblejs/assets/client-1a2b.js"] };
    expect(Object.keys(assets).sort()).toEqual(["css", "js"]);
  });
});
