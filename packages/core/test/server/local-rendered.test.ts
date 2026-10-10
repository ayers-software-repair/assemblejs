// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { LocalRendered } from "@assemblejs/core";

describe("one assembly, rendered in this process", () => {
  it("is its envelope and the account of every child its view placed", () => {
    const childless: LocalRendered = { html: "<assembly-root></assembly-root>", diagnostics: [] };
    const parent: LocalRendered = {
      html: "<assembly-root><assembly-root></assembly-root></assembly-root>",
      diagnostics: [{ name: "cart", view: "default", id: "c1", source: "local", ms: 4 }],
    };
    expect(childless.diagnostics).toEqual([]);
    expect(parent.diagnostics.map((child) => child.name)).toEqual(["cart"]);
  });
});
