// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createBus } from "@assemblejs/core/client";
import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { EVENTS_KEY, useEvents } from "@assemblejs/renderer-vue/client";

const Sender = defineComponent({
  setup() {
    const events = useEvents();
    return () => h("p", typeof events.send);
  },
});

describe("reaching this assembly's events", () => {
  it("returns the object the assembly was mounted with", async () => {
    const app = createSSRApp(Sender);
    app.provide(
      EVENTS_KEY,
      createBus().forAssembly({ id: "1", name: "cart", view: "default" }).events,
    );
    expect(await renderToString(app)).toBe("<p>function</p>");
  });

  // A function that quietly answers nothing turns a wiring mistake into a component that
  // silently never hears anything.
  it("throws outside an assembly rather than answering undefined", async () => {
    const app = createSSRApp(Sender);
    app.config.errorHandler = (error) => {
      throw error;
    };
    await expect(renderToString(app)).rejects.toThrow(/outside an assembly/);
  });
});
