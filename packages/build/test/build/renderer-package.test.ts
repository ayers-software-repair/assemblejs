// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { RendererPackage } from "@asmjs/build";

describe("a renderer the build can wire", () => {
  it("is a name and the package that holds both its halves", () => {
    const known: RendererPackage = { name: "react", package: "@asmjs/renderer-react" };
    expect(known.package).toContain(known.name);
  });
});
