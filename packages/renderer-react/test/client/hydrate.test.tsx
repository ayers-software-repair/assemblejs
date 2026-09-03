// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { useEffect, useState } from "react";
import { act } from "react";
import { renderToMarkup } from "@assemblejs/renderer-react";
import { hydrate, useEvents } from "@assemblejs/renderer-react/client";
import { createBus } from "@assemblejs/core/client";
import type { AssemblyProps } from "@assemblejs/renderer-react";
import { beforeEach, describe, expect, it } from "vitest";

const Counter = ({ data }: AssemblyProps) => {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount(count + 1)}>
      {String(data["label"])} {count}
    </button>
  );
};

const mountInto = async (data: Record<string, unknown>) => {
  const element = document.createElement("assembly-root");
  element.innerHTML = renderToMarkup(Counter, { data: data as never, children: {} });
  document.body.append(element);
  const { events } = createBus().forAssembly({ id: "a", name: "counter", view: "default" });
  let handle!: { unmount: () => void };
  await act(async () => {
    handle = hydrate(Counter).mount(element, data as never, {
      id: "a",
      name: "counter",
      view: "default",
      events,
    });
  });
  return { element, handle };
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("hydrating a React assembly", () => {
  it("takes over the markup the server already sent", async () => {
    const { element } = await mountInto({ label: "Clicked" });
    // The server's markup is what the visitor saw; hydration adopts it rather than replacing it.
    expect(element.textContent).toContain("Clicked");
    expect(element.querySelector("button")).not.toBeNull();
  });

  it("makes it interactive", async () => {
    const { element } = await mountInto({ label: "Clicked" });
    const button = element.querySelector("button");
    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(element.textContent).toContain("1");
  });

  // A teardown nothing invokes is not a teardown, so mount returns the handle the runtime calls.
  it("returns a handle that tears it down", async () => {
    const { element, handle } = await mountInto({ label: "Clicked" });
    await act(async () => handle.unmount());
    expect(element.querySelector("button")).toBeNull();
  });

  // Written so it exercises hydrate's wiring and not the bus's. The first version subscribed
  // from outside the component, so it stayed green with the events provider deleted: it was
  // proving the bus worked, which was never in question here.
  it("gives the component this assembly's events, through the hook", async () => {
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
    await act(async () => {
      hydrate(Listener).mount(element, {}, { id: "b", name: "listener", view: "default", events });
    });
    bus.forAssembly({ id: "c", name: "sender", view: "default" }).events.send("ping", {});
    expect(heard).toBe("sender");
  });
});
