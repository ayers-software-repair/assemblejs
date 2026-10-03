// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineAssembly, renderLocal } from "@assemblejs/core";

const hello = defineAssembly({
  name: "hello",
  mount: "visible",
  views: {
    default: {
      renderer: "html",
      data: ({ query }) => ({ who: query.get("who") ?? "world" }),
      markup: ({ data }) => `<p>Hello, ${String(data["who"])}</p>`,
    },
  },
});

describe("rendering an assembly in this process", () => {
  it("answers its markup and data in the envelope, stamped with the given id", async () => {
    const html = await renderLocal(hello, "default", "a7f3", new URLSearchParams("who=ada"));
    expect(html).toContain("<p>Hello, ada</p>");
    expect(html).toContain('data-id="a7f3"');
    expect(html).toContain('"data":{"who":"ada"}');
  });

  it("declares the assembly's mount mode on the envelope", async () => {
    const html = await renderLocal(hello, "default", "a7f3", new URLSearchParams());
    expect(html).toContain('data-mount="visible"');
  });

  it("refuses a view the assembly does not have", async () => {
    await expect(renderLocal(hello, "wide", "a7f3", new URLSearchParams())).rejects.toThrow(
      /no view "wide"/,
    );
  });

  it("renders an assembly that opted into Shadow DOM inside its shadow root, with its styles", async () => {
    const isolated = defineAssembly({
      name: "card",
      shadow: true,
      views: { default: { renderer: "html", markup: () => "<p>card</p>" } },
      assets: { css: ["/_assemblejs/assets/styles/card-1.css"], js: [] },
    });
    const html = await renderLocal(isolated, "default", "a7f3", new URLSearchParams());
    expect(html).toContain(
      '<template shadowrootmode="open"><p>card</p><link rel="stylesheet" href="/_assemblejs/assets/styles/card-1.css"></template>',
    );
  });
});
