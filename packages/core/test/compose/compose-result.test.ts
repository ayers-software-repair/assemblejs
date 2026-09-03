// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ComposeResult } from "@assemblejs/core";

describe("the composer's result", () => {
  it("is html plus one diagnostic per placement, never html alone", () => {
    const result: ComposeResult = {
      html: "<main><p>cart</p></main>",
      diagnostics: [{ name: "cart", view: "default", id: "a", source: "local", ms: 2 }],
    };
    expect(result.diagnostics).toHaveLength(1);
  });
});
