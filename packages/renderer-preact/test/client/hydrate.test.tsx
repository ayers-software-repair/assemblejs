// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { useEffect, useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { renderToMarkup } from "@assemblejs/renderer-preact";
import { Slot, hydrate, useEvents } from "@assemblejs/renderer-preact/client";
import { createBus } from "@assemblejs/core/client";
import type { AssemblyProps } from "@assemblejs/renderer-preact";
import { beforeEach, describe, expect, it } from "vitest";

const Counter = ({ data }: AssemblyProps) => {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {String(data["label"])} {count}
    </button>
  );
};

const mountInto = (data: Record<string, unknown>, into?: ShadowRoot) => {
  const element = document.createElement("assembly-root");
  document.body.append(element);
  const container = into ?? element;
  container.innerHTML = renderToMarkup(Counter, { data: data as never });
  const server = container.querySelector("button");
  const { events } = createBus().forAssembly({ id: "a", name: "counter", view: "default" });
  let handle!: { unmount: () => void };
  act(() => {
    handle = hydrate(Counter).mount(container, data as never, {
      id: "a",
      name: "counter",
      view: "default",
      events,
    });
  });
  return { container, handle, server };
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("hydrating a Preact assembly", () => {
  it("adopts the markup the server already sent rather than replacing it", () => {
    const { container, server } = mountInto({ label: "Clicked" });
    expect(container.querySelector("button")).toBe(server);
    expect(container.textContent).toContain("Clicked");
  });

  it("makes it interactive", () => {
    const { container } = mountInto({ label: "Clicked" });
    act(() => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(container.textContent).toContain("Clicked 1");
  });

  it("hydrates inside the assembly's own shadow root", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    const { container } = mountInto({ label: "Shadowed" }, shadow);
    act(() => {
      container.querySelector("button")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(shadow.textContent).toContain("Shadowed 1");
  });

  // A teardown nothing invokes is not a teardown, so mount returns the handle the runtime calls.
  it("returns a handle that tears it down", () => {
    const { container, handle } = mountInto({ label: "Clicked" });
    act(() => handle.unmount());
    expect(container.querySelector("button")).toBeNull();
  });

  it("gives the component this assembly's events, through the hook", () => {
    const bus = createBus();
    const element = document.createElement("assembly-root");
    document.body.append(element);
    let heard = "";
    const Listener = () => {
      const events = useEvents();
      useEffect(() => events.on("ping", (message) => (heard = message.from.name)), [events]);
      return <p>listener</p>;
    };
    const { events } = bus.forAssembly({ id: "b", name: "listener", view: "default" });
    act(() => {
      hydrate(Listener).mount(element, {}, { id: "b", name: "listener", view: "default", events });
    });
    bus.forAssembly({ id: "c", name: "sender", view: "default" }).events.send("ping", {});
    expect(heard).toBe("sender");
  });
});

const Shell = () => {
  const [count, setCount] = useState(0);
  return (
    <article>
      <button type="button" id="shell" onClick={() => setCount(count + 1)}>
        shell {count}
      </button>
      <Slot name="inner" />
    </article>
  );
};
const CHILD =
  '<assembly-root data-id="b" data-name="inner"><p id="child">from another renderer</p></assembly-root>';

describe("a child placed in a Preact assembly", () => {
  it("is left as it is when its parent hydrates, and when its parent renders again", () => {
    const element = document.createElement("assembly-root");
    // What the composer serves: the child's envelope where the slot's directive stood.
    element.innerHTML = renderToMarkup(Shell, { data: {} }).replace(
      '<assembly name="inner"></assembly>',
      CHILD,
    );
    document.body.append(element);
    const child = element.querySelector("#child");
    expect(child).not.toBeNull();
    const { events } = createBus().forAssembly({ id: "a", name: "shell", view: "default" });
    act(() => {
      hydrate(Shell).mount(element, {}, { id: "a", name: "shell", view: "default", events });
    });
    expect(element.querySelector("#child")).toBe(child);
    for (let clicks = 0; clicks < 2; clicks += 1) {
      act(() => {
        element.querySelector("#shell")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    }
    expect(element.querySelector("#shell")?.textContent).toBe("shell 2");
    // The same node, still in the page: the parent's own render wrote nothing into the slot.
    expect(element.querySelector("#child")).toBe(child);
  });
});
