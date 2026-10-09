// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createBus } from "@assemblejs/core/client";
import { beforeEach, describe, expect, it } from "vitest";
import { hydrate } from "@assemblejs/renderer-lit/client";
import { BUTTON_MARKUP } from "../fixtures/button-markup.js";
import { buttonView } from "../fixtures/button-view.js";

const mountInto = (into?: ShadowRoot) => {
  const element = document.createElement("assembly-root");
  document.body.append(element);
  const container = into ?? element;
  container.innerHTML = BUTTON_MARKUP;
  const server = container.querySelector("button");
  const bus = createBus();
  const pressed: string[] = [];
  bus
    .forAssembly({ id: "o", name: "observer", view: "default" })
    .events.on("pressed", (message) => pressed.push(message.from.name));
  const { events } = bus.forAssembly({ id: "a", name: "button", view: "default" });
  const handle = hydrate(buttonView).mount(
    container,
    { label: "Press" },
    {
      id: "a",
      name: "button",
      view: "default",
      events,
    },
  );
  return { container, handle, server, pressed };
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("hydrating a Lit view", () => {
  it("adopts the markup the server sent, and binds its events with this assembly's", () => {
    const { container, server, pressed } = mountInto();
    expect(container.querySelector("button")).toBe(server);
    server?.click();
    expect(pressed).toEqual(["button"]);
  });

  it("hydrates inside the assembly's own shadow root", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    const { server, pressed } = mountInto(shadow);
    server?.click();
    expect(pressed).toEqual(["button"]);
  });

  // A teardown nothing invokes is not a teardown, so mount returns the handle the runtime calls.
  it("returns a handle that tears it down", () => {
    const { container, handle } = mountInto();
    handle.unmount();
    expect(container.querySelector("button")).toBeNull();
  });
});
