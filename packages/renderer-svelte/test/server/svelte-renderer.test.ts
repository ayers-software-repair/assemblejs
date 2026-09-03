// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { svelteRenderer } from "@assemblejs/renderer-svelte";
import Counter from "../fixtures/Counter.svelte";

describe("the Svelte renderer", () => {
  it("claims its own extension, with no infix", () => {
    expect(svelteRenderer.name).toBe("svelte");
    // .svelte says which framework wrote the file on its own; an infix would be ceremony that
    // answers a question nobody has.
    expect(svelteRenderer.extensions).toEqual([".svelte"]);
  });

  it("renders through the interface core defines", async () => {
    const html = await svelteRenderer.render({
      template: Counter,
      data: { label: "hello" },
      children: {},
      helpers: {},
      url: new URL("https://example.com/"),
    });
    expect(html).toContain("hello");
  });
});
