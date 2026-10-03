// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { createBus } from "@assemblejs/core/client";
import { beforeEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick, onMounted, ref } from "vue";
import type { PropType } from "vue";
import { renderToMarkup } from "@assemblejs/renderer-vue";
import { hydrate, useEvents } from "@assemblejs/renderer-vue/client";

const Counter = defineComponent({
  props: { data: { type: Object as PropType<Record<string, unknown>>, required: true } },
  setup(given) {
    const count = ref(0);
    return () =>
      h(
        "button",
        { type: "button", onClick: () => (count.value += 1) },
        `${String(given.data["label"])} ${count.value}`,
      );
  },
});

const mountInto = async (data: Record<string, unknown>, into?: ShadowRoot) => {
  const element = document.createElement("assembly-root");
  document.body.append(element);
  const container = into ?? element;
  container.innerHTML = await renderToMarkup(Counter, { data: data as never, children: {} });
  const server = container.querySelector("button");
  const { events } = createBus().forAssembly({ id: "a", name: "counter", view: "default" });
  const handle = hydrate(Counter).mount(container, data as never, {
    id: "a",
    name: "counter",
    view: "default",
    events,
  });
  return { container, handle, server };
};

const click = async (container: Element | ShadowRoot) => {
  container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await nextTick();
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("hydrating a Vue assembly", () => {
  it("adopts the markup the server already sent rather than replacing it", async () => {
    const { container, server } = await mountInto({ label: "Clicked" });
    expect(container.querySelector("button")).toBe(server);
  });

  it("makes it interactive", async () => {
    const { container } = await mountInto({ label: "Clicked" });
    await click(container);
    expect(container.textContent).toContain("Clicked 1");
  });

  it("hydrates inside the assembly's own shadow root", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    const { container } = await mountInto({ label: "Shadowed" }, shadow);
    await click(container);
    expect(shadow.textContent).toContain("Shadowed 1");
  });

  // A teardown nothing invokes is not a teardown, so mount returns the handle the runtime calls.
  it("returns a handle that tears it down", async () => {
    const { container, handle } = await mountInto({ label: "Clicked" });
    handle.unmount();
    expect(container.querySelector("button")).toBeNull();
  });

  it("gives the component this assembly's events, through useEvents", () => {
    const bus = createBus();
    const element = document.createElement("assembly-root");
    document.body.append(element);
    let heard = "";
    const Listener = defineComponent({
      setup() {
        const events = useEvents();
        onMounted(() => events.on("ping", (message) => (heard = message.from.name)));
        return () => h("p", "listener");
      },
    });
    const { events } = bus.forAssembly({ id: "b", name: "listener", view: "default" });
    hydrate(Listener).mount(element, {}, { id: "b", name: "listener", view: "default", events });
    bus.forAssembly({ id: "c", name: "sender", view: "default" }).events.send("ping", {});
    expect(heard).toBe("sender");
  });
});
