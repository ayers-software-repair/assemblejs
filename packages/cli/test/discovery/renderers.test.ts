// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RENDERERS, RENDERER_PACKAGES } from "@assemblejs/cli";

describe("the renderers a view can be scaffolded for", () => {
  it("are a plain template and exactly the frameworks the build can build", () => {
    expect([...RENDERERS].sort()).toEqual(["html", ...Object.keys(RENDERER_PACKAGES)].sort());
  });
});
