// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ComposeOptions } from "@assemblejs/core";

describe("the composer's options", () => {
  it("need only a template, a plan, a fetch, a page, and the two injected sources", () => {
    const options: ComposeOptions = {
      template: "<main></main>",
      plan: {},
      fetch: async () => ({ ok: true, html: "", source: "local" }),
      page: "p1",
      newId: () => "a",
      now: () => 0,
    };
    expect(options.cache).toBeUndefined();
    expect(options.limits).toBeUndefined();
  });
});
