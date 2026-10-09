// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { html } from "lit";
import { describe, expect, it } from "vitest";
import { litRenderer } from "@assemblejs/renderer-lit";
import type { AssemblyProps } from "@assemblejs/renderer-lit";

describe("the Lit renderer", () => {
  it("claims the extensions that say which framework wrote the file", () => {
    expect(litRenderer.name).toBe("lit");
    expect(litRenderer.extensions).toEqual([".lit.ts", ".lit.js"]);
  });

  it("renders through the interface core defines", async () => {
    const out = await litRenderer.render({
      template: (props: AssemblyProps) => html`<p>${String(props.data["greeting"])}</p>`,
      data: { greeting: "hello" },
      children: {},
      helpers: {},
      url: new URL("https://example.com/"),
    });
    expect(out).toContain("hello");
  });
});
