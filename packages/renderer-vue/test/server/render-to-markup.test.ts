// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import {
  defineAsyncComponent,
  defineComponent,
  h,
  onServerPrefetch,
  Suspense,
  warn,
  watchEffect,
} from "vue";
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
  // The production run is worth having only if it loads Vue's production build, whose warn is
  // a no-op and whose error handling only reports.
  it("runs against the build the run names", () => {
    const logged = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    warn("which build");
    expect(logged.mock.calls.length > 0).toBe(
      process.env["ASSEMBLEJS_VUE_BUILD"] === "development",
    );
    logged.mockRestore();
  });

  it("produces the markup the server sends", async () => {
    expect(await renderToMarkup(Cart, { data: { total: 2 } })).toBe("<p>Items: 2</p>");
  });

  it("escapes what it renders, because Vue does", async () => {
    const Danger = defineComponent({
      props,
      setup: (given) => () => h("p", String(given.data["text"])),
    });
    const html = await renderToMarkup(Danger, {
      data: { text: "<script>alert(1)</script>" },
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
    await expect(renderToMarkup(Broken, { data: {} })).rejects.toThrow("this component is broken");
  });

  it("rejects for an error anywhere Vue would otherwise only report it", async () => {
    const boom = (): never => {
      throw new Error("boom");
    };
    const Child = defineComponent({ setup: () => () => h("b", boom()) });
    for (const [what, component] of [
      [
        "a throwing child",
        defineComponent({
          setup: () => () => h("p", [h("i", "before"), h(Child), h("i", "after")]),
        }),
      ],
      ["a throwing setup", defineComponent({ setup: () => boom() })],
      [
        "an async setup that rejects",
        defineComponent({
          async setup() {
            await Promise.resolve();
            return boom();
          },
        }),
      ],
      [
        "a server prefetch that rejects",
        defineComponent({
          setup() {
            onServerPrefetch(async () => boom());
            return () => h("p", "items");
          },
        }),
      ],
      [
        "a watcher that throws",
        defineComponent({
          setup() {
            watchEffect(() => boom());
            return () => h("p", "x");
          },
        }),
      ],
      [
        "a suspended child that fails",
        defineComponent({
          setup: () => () =>
            h(Suspense, null, { default: () => h(defineAsyncComponent(async () => boom())) }),
        }),
      ],
    ] as const) {
      await expect(renderToMarkup(component, { data: {} }), what).rejects.toThrow();
    }
  });

  it("renders a component that uses its events, as it will hydrate", async () => {
    const Readout = defineComponent({
      setup: () => {
        const events = useEvents();
        return () => h("p", events.last("counted") === undefined ? "nothing yet" : "heard");
      },
    });
    expect(await renderToMarkup(Readout, { data: {} })).toBe("<p>nothing yet</p>");
  });
});
