// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { RenderedAssembly } from "@assemblejs/mcp";

describe("what rendering answered", () => {
  it("is the markup, the data and the account, together", () => {
    const answer: RenderedAssembly = {
      name: "cart",
      view: "default",
      renderer: "html",
      html: "<assembly-root></assembly-root>",
      data: {},
      problems: [],
    };
    // Any one of the three alone leaves "did what I just wrote work" open.
    expect(Object.keys(answer)).toContain("html");
    expect(Object.keys(answer)).toContain("data");
    expect(Object.keys(answer)).toContain("problems");
  });
});
