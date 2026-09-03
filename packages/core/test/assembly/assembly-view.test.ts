// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyView } from "@assemblejs/core";

describe("one view of one assembly", () => {
  it("declares a renderer, a data function and a markup function", () => {
    const view: AssemblyView = {
      renderer: "html",
      data: () => ({ greeting: "hello" }),
      markup: ({ data }) => `<p>${String(data["greeting"])}</p>`,
    };
    expect(view.renderer).toBe("html");
  });
});
