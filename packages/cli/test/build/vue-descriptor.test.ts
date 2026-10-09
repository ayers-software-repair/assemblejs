// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { VueDescriptor } from "@assemblejs/cli";

describe("the parts of a component a build reads", () => {
  it("can be a template alone", () => {
    const descriptor: VueDescriptor = {
      script: null,
      scriptSetup: null,
      template: { content: "<p>a</p>" },
      styles: [],
      cssVars: [],
    };
    expect(descriptor.template?.content).toBe("<p>a</p>");
  });
});
