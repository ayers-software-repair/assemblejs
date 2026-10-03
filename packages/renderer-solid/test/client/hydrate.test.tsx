// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { onMount, sharedConfig } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBus } from "@assemblejs/core/client";
import { hydrate, useEvents } from "@assemblejs/renderer-solid/client";
import type { Component } from "solid-js";
import type { AssemblyProps } from "@assemblejs/renderer-solid";
import { counterMarkup } from "../fixtures/counter-markup.js";
import { Counter } from "../fixtures/counter.js";
import { LateIsland } from "../fixtures/late-island.js";
import { LATE_MARKUP } from "../fixtures/late-markup.js";
import { NESTED_MARKUP } from "../fixtures/nested-markup.js";
import { Outer } from "../fixtures/outer.js";

const mount = (
  component: Component<AssemblyProps>,
  container: Element | ShadowRoot,
  id: string,
  data = {},
) => {
  const { events } = createBus().forAssembly({ id, name: "island", view: "default" });
  return hydrate(component).mount(container, data, { id, name: "island", view: "default", events });
};

const mountInto = (id: string, into?: ShadowRoot) => {
  const element = document.createElement("assembly-root");
  document.body.append(element);
  const container = into ?? element;
  container.innerHTML = counterMarkup(id);
  const server = container.querySelector("button");
  const handle = mount(Counter, container, id, { label: "Clicked" });
  return { container, handle, server };
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("hydrating a Solid assembly", () => {
  it("adopts the markup the server already sent, and makes it interactive", () => {
    const { container, server } = mountInto("a");
    expect(container.querySelector("button")).toBe(server);
    server?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(container.textContent).toContain("Clicked 1");
  });

  it("adopts the markup of every assembly on the page, not only the first to mount", () => {
    const first = mountInto("a");
    const second = mountInto("c");
    expect(second.container.querySelector("button")).toBe(second.server);
    second.server?.click();
    expect(second.container.textContent).toContain("Clicked 1");
    expect(first.container.textContent).toContain("Clicked 0");
  });

  it("hydrates inside the assembly's own shadow root", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    const { server } = mountInto("a", shadow);
    server?.click();
    expect(shadow.textContent).toContain("Clicked 1");
  });

  // A teardown nothing invokes is not a teardown, so mount returns the handle the runtime calls.
  it("returns a handle that tears it down", () => {
    const { container, handle, server } = mountInto("a");
    handle.unmount();
    server?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(container.textContent).not.toContain("Clicked 1");
  });

  it("gives the component this assembly's events", () => {
    const bus = createBus();
    const element = document.createElement("assembly-root");
    element.innerHTML = '<p data-hk="b000">listener</p>';
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

  // An island holds its child's envelope, so its markup holds the child's keyed nodes too, and
  // the two may mount in either order.
  it("adopts an island and the island inside it, whichever mounts first", () => {
    for (const innerFirst of [true, false]) {
      document.body.innerHTML = `<assembly-root data-id="a">${NESTED_MARKUP}</assembly-root>`;
      const outerElement = document.querySelector('[data-id="a"]');
      const innerElement = document.querySelector('[data-id="b"]');
      if (outerElement === null || innerElement === null) throw new Error("no envelopes");
      const [innerButton, outerButton] = [...document.querySelectorAll("button")];
      const inner = () => mount(Counter, innerElement, "b", { label: "Clicked" });
      const outer = () => mount(Outer, outerElement, "a");
      for (const step of innerFirst ? [inner, outer] : [outer, inner]) step();
      expect([...document.querySelectorAll("button")]).toEqual([innerButton, outerButton]);
      innerButton?.click();
      outerButton?.click();
      outerButton?.click();
      expect(innerButton?.textContent).toBe("Clicked 1");
      expect(outerButton?.textContent).toBe("Outer 2");
    }
  });

  // Mounting the next island replaces Solid's registry of server nodes; a lazy part of an island
  // already mounted, whose module arrives after that, still adopts its own server node.
  it("adopts a lazy part that arrives after another island has mounted", async () => {
    const element = document.createElement("assembly-root");
    element.innerHTML = LATE_MARKUP;
    document.body.append(element);
    const server = element.querySelector("span");
    mount(LateIsland, element, "a");
    mountInto("c");
    await vi.waitFor(() => expect(server?.hasAttribute("data-live")).toBe(true));
    expect(element.querySelector("span")).toBe(server);
  });

  it("keeps a lazy part's server node claimable when the next island fails to hydrate", async () => {
    const element = document.createElement("assembly-root");
    element.innerHTML = LATE_MARKUP;
    document.body.append(element);
    const server = element.querySelector("span");
    mount(LateIsland, element, "a");
    const broken = document.createElement("assembly-root");
    broken.innerHTML = "<p>markup with none of its keys</p>";
    document.body.append(broken);
    expect(() => mount(() => <section>other</section>, broken, "c")).toThrow(/Hydration/);
    await vi.waitFor(() => expect(server?.hasAttribute("data-live")).toBe(true));
    expect(element.querySelector("span")).toBe(server);
  });

  it("adopts the fresh markup of a placement mounted again before its lazy part arrives", async () => {
    const element = document.createElement("assembly-root");
    element.innerHTML = LATE_MARKUP;
    document.body.append(element);
    const stale = element.querySelector("span");
    mount(LateIsland, element, "a").unmount();
    element.innerHTML = LATE_MARKUP;
    const fresh = element.querySelector("span");
    mount(LateIsland, element, "a");
    await vi.waitFor(() => expect(fresh?.hasAttribute("data-live")).toBe(true));
    expect(stale?.hasAttribute("data-live")).toBe(false);
  });

  // A node an island left unclaimed and the page then removed is not kept for the page's life.
  it("lets go of server nodes no longer in the page", () => {
    const element = document.createElement("assembly-root");
    element.innerHTML = LATE_MARKUP;
    document.body.append(element);
    mount(LateIsland, element, "a").unmount();
    element.remove();
    mountInto("c");
    expect([...(sharedConfig.registry?.values() ?? [])].every((node) => node.isConnected)).toBe(
      true,
    );
  });
});
