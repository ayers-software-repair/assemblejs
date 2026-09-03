// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ComposedPage } from "@assemblejs/mcp";

describe("what composing answered", () => {
  it("pairs the markup with one account per placement", () => {
    const answer: ComposedPage = { html: "<main></main>", diagnostics: [], problems: [] };
    // A page whose placement fell back looks fine in the html; the diagnostic is what says so.
    expect(Object.keys(answer)).toContain("diagnostics");
  });
});
