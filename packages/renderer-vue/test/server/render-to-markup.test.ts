// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import type { PropType } from "vue";
import { renderToMarkup } from "@assemblejs/renderer-vue";
import { useEvents } from "@assemblejs/renderer-vue/client";

const props = {
  data: { type: Object as PropType<Record<string, unknown>>, required: true },
} as const;
const Cart = defineComponent({
  props,
  setup: (given) => () => h("p", `Items: ${String(given.data["total"])}`),
});

describe("rendering a Vue assembly on the server", () => {
  it("produces the markup the server sends", async () => {
    expect(await renderToMarkup(Cart, { data: { total: 2 }, children: {} })).toBe(
      "<p>Items: 2</p>",
    );
  });

  it("escapes what it renders, because Vue does", async () => {
    const Danger = defineComponent({
      props,
      setup: (given) => () => h("p", String(given.data["text"])),
    });
    const html = await renderToMarkup(Danger, {
      data: { text: "<script>alert(1)</script>" },
      children: {},
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  // Vue on its own warns about a component that throws and sends what it had, which passes every
  // check downstream, so the page looks fine and is wrong.
  it("rejects rather than sending a page with a hole in it", async () => {
    const Broken = defineComponent({
      setup: () => () => {
        throw new Error("this component is broken");
      },
    });
    await expect(renderToMarkup(Broken, { data: {}, children: {} })).rejects.toThrow(
      "this component is broken",
    );
  });

  it("renders a component that uses its events, as it will hydrate", async () => {
    const Readout = defineComponent({
      setup: () => {
        const events = useEvents();
        return () => h("p", events.last("counted") === undefined ? "nothing yet" : "heard");
      },
    });
    expect(await renderToMarkup(Readout, { data: {}, children: {} })).toBe("<p>nothing yet</p>");
  });
});
