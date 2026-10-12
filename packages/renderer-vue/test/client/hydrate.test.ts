// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { createBus } from "@assemblejs/core/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, onMounted, ref, useId } from "vue";
import type { PropType } from "vue";
import { renderToMarkup } from "@assemblejs/renderer-vue";
import { Slot, hydrate, useEvents } from "@assemblejs/renderer-vue/client";

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
  container.innerHTML = await renderToMarkup(Counter, { data: data as never });
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

const Shell = defineComponent({
  setup() {
    const count = ref(0);
    return () =>
      h("article", [
        h(
          "button",
          { type: "button", id: "shell", onClick: () => (count.value += 1) },
          `shell ${count.value}`,
        ),
        h(Slot, { name: "inner" }),
      ]);
  },
});
const CHILD =
  '<assembly-root data-id="b" data-name="inner"><p id="child">from another renderer</p></assembly-root>';

describe("a child placed in a Vue assembly", () => {
  it("is left as it is when its parent hydrates, and when its parent renders again", async () => {
    // Vue's development build reports what hydration finds different as a warning.
    const warned = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const complaints = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const element = document.createElement("assembly-root");
    // What the composer serves: the child's envelope where the slot's directive stood.
    element.innerHTML = (await renderToMarkup(Shell, { data: {} })).replace(
      '<assembly name="inner"></assembly>',
      CHILD,
    );
    document.body.append(element);
    const child = element.querySelector("#child");
    expect(child).not.toBeNull();
    const { events } = createBus().forAssembly({ id: "a", name: "shell", view: "default" });
    hydrate(Shell).mount(element, {}, { id: "a", name: "shell", view: "default", events });
    expect(element.querySelector("#child")).toBe(child);
    for (let clicks = 0; clicks < 2; clicks += 1) {
      element.querySelector("#shell")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await nextTick();
    }
    expect(element.querySelector("#shell")?.textContent).toBe("shell 2");
    // The same node, still in the page: the parent's own render wrote nothing into the slot.
    expect(element.querySelector("#child")).toBe(child);
    expect([...warned.mock.calls, ...complaints.mock.calls]).toEqual([]);
    warned.mockRestore();
    complaints.mockRestore();
  });
});

// The ids a component makes carry the placement's id on the server, so they must in the browser:
// hydrated without it, Vue made other ids than the markup had and said so.
describe("the ids a Vue component makes", () => {
  it("are in the browser what the server made, the placement's id before them", async () => {
    const Field = defineComponent({
      setup: () => {
        const id = useId();
        return () => h("label", { for: id }, ["q", h("input", { id })]);
      },
    });
    const warned = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const element = document.createElement("assembly-root");
    element.innerHTML = await renderToMarkup(Field, { data: {}, id: "aaaa" });
    const sent = element.querySelector("input")?.id ?? "";
    const { events } = createBus().forAssembly({ id: "aaaa", name: "field", view: "default" });
    hydrate(Field).mount(element, {}, { id: "aaaa", name: "field", view: "default", events });
    await nextTick();
    const mismatches = warned.mock.calls.filter((call) => String(call[0]).includes("mismatch"));
    warned.mockRestore();
    expect(sent).toContain("aaaa");
    expect(element.querySelector("input")?.id).toBe(sent);
    expect(mismatches).toEqual([]);
  });
});
