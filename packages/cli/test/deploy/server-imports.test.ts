// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { serverImports } from "@assemblejs/cli";

describe("the packages a built server imports", () => {
  it("are every bare specifier it imports, exports from or imports at run time, by package", () => {
    const code = [
      'import { createServer } from "@assemblejs/core";',
      'import "@assemblejs/renderer-react/server";',
      'export * from "lib/deep/path.js";',
      'export { a } from "other";',
      'const later = () => import("lazy-pkg");',
      'import { readFileSync } from "node:fs";',
      'import path from "path";',
      'import local from "./local.js";',
      'import mapped from "#internal/thing.js";',
    ].join("\n");
    expect(serverImports(code)).toEqual([
      "#internal/thing.js",
      "@assemblejs/core",
      "@assemblejs/renderer-react",
      "lazy-pkg",
      "lib",
      "other",
    ]);
  });
});
