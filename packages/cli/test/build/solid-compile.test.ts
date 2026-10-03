// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { SolidCompile } from "@assemblejs/cli";

describe("the Solid compiler a build calls", () => {
  it("takes JSX and the side, and answers code", () => {
    const compile: SolidCompile = (source, { side }) => `/* ${side} */ ${source}`;
    expect(compile("x", { filename: "a.jsx", side: "client" })).toBe("/* client */ x");
  });
});
