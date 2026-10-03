// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RENDERER_PACKAGES } from "@assemblejs/cli";

describe("the renderers a build can wire", () => {
  it("names each by the renderer a view declares, and plain html needs none", () => {
    for (const [name, known] of Object.entries(RENDERER_PACKAGES)) {
      expect(known.name).toBe(name);
      expect(known.package).toBe(`@assemblejs/renderer-${name}`);
    }
    expect(Object.hasOwn(RENDERER_PACKAGES, "html")).toBe(false);
  });
});
