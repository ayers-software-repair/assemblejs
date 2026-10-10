// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Renderer } from "@assemblejs/core/renderer";

describe("a server renderer", () => {
  it("turns one view and its data into html", async () => {
    const renderer: Renderer = {
      name: "html",
      extensions: [".html"],
      render: (input) => String(input.template).replace("{{total}}", String(input.data["total"])),
    };
    const html = await renderer.render({
      template: "<main>{{total}}</main>",
      data: { total: 2 },
      helpers: {},
      url: new URL("https://example.com/"),
    });
    expect(html).toBe("<main>2</main>");
  });

  it("throws rather than returning its own error markup", async () => {
    const renderer: Renderer = {
      name: "broken",
      extensions: [".broken"],
      render: () => {
        throw new Error("template is malformed");
      },
    };
    // The composer catches this and falls back. A renderer that caught it would emit markup
    // that passes every check downstream.
    await expect(async () =>
      renderer.render({
        template: "",
        data: {},
        helpers: {},
        url: new URL("https://example.com/"),
      }),
    ).rejects.toThrow("template is malformed");
  });
});
