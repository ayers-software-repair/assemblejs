// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { Slot } from "@assemblejs/renderer-vue/client";

const render = (children: Record<string, string>, name: string) =>
  renderToString(createSSRApp({ render: () => h(Slot, { children, name }) }));

describe("placing a child assembly", () => {
  it("inserts its already-rendered html verbatim", async () => {
    const html = await render({ inner: "<p>from another renderer</p>" }, "inner");
    // Safe for one reason: this html came from another assembly's own renderer through the
    // composer, not from anything a visitor supplied.
    expect(html).toContain("<p>from another renderer</p>");
    expect(html).toContain(`data-assembly-slot="inner"`);
  });

  it("renders empty for a child that is not there, rather than undefined", async () => {
    expect(await render({}, "missing")).not.toContain("undefined");
  });
});
