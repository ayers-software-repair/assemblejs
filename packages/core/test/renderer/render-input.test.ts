// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { RenderInput } from "@assemblejs/core/renderer";

describe("what a renderer receives", () => {
  it("is the view and its data, and never a child", () => {
    const input: RenderInput = {
      template: '<main><assembly name="cart"></assembly></main>',
      data: { total: 2 },
      helpers: {},
      url: new URL("https://example.com/"),
    };
    // A renderer never fetches a child and is never handed one: the view writes the directive,
    // and the composer places the child once the view has rendered.
    expect(Object.keys(input).sort()).toEqual(["data", "helpers", "template", "url"]);
  });
});
