// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { onMount } from "solid-js";
import { beforeEach, describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";
import { hydrate, useEvents } from "@assemblejs/renderer-solid/client";
import { COUNTER_MARKUP } from "../fixtures/counter-markup.js";
import { Counter } from "../fixtures/counter.js";

const mountInto = (into?: ShadowRoot) => {
  const element = document.createElement("assembly-root");
  document.body.append(element);
  const container = into ?? element;
  container.innerHTML = COUNTER_MARKUP;
  const server = container.querySelector("button");
  const { events } = createBus().forAssembly({ id: "a", name: "counter", view: "default" });
  const handle = hydrate(Counter).mount(
    container,
    { label: "Clicked" },
    {
      id: "a",
      name: "counter",
      view: "default",
      events,
    },
  );
  return { container, handle, server };
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("hydrating a Solid assembly", () => {
  it("adopts the markup the server already sent, and makes it interactive", () => {
    const { container, server } = mountInto();
    expect(container.querySelector("button")).toBe(server);
    server?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(container.textContent).toContain("Clicked 1");
  });

  it("adopts the markup of every assembly on the page, not only the first to mount", () => {
    const first = mountInto();
    const second = mountInto();
    expect(second.container.querySelector("button")).toBe(second.server);
    second.server?.click();
    expect(second.container.textContent).toContain("Clicked 1");
    expect(first.container.textContent).toContain("Clicked 0");
  });

  it("hydrates inside the assembly's own shadow root", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    const { server } = mountInto(shadow);
    server?.click();
    expect(shadow.textContent).toContain("Clicked 1");
  });

  // A teardown nothing invokes is not a teardown, so mount returns the handle the runtime calls.
  it("returns a handle that tears it down", () => {
    const { container, handle, server } = mountInto();
    handle.unmount();
    server?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(container.textContent).not.toContain("Clicked 1");
  });

  it("gives the component this assembly's events", () => {
    const bus = createBus();
    const element = document.createElement("assembly-root");
    element.innerHTML = '<p data-hk="000">listener</p>';
    document.body.append(element);
    let heard = "";
    const Listener = () => {
      const events = useEvents();
      onMount(() => events.on("ping", (message) => (heard = message.from.name)));
      return <p>listener</p>;
    };
    const { events } = bus.forAssembly({ id: "b", name: "listener", view: "default" });
    hydrate(Listener).mount(element, {}, { id: "b", name: "listener", view: "default", events });
    bus.forAssembly({ id: "c", name: "sender", view: "default" }).events.send("ping", {});
    expect(heard).toBe("sender");
  });
});
