// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createBus } from "@assemblejs/core/client";
import { render } from "lit/html.js";
import { beforeEach, describe, expect, it } from "vitest";
import { hydrate } from "@assemblejs/renderer-lit/client";
import { BUTTON_MARKUP } from "../fixtures/button-markup.js";
import { buttonView } from "../fixtures/button-view.js";
import { shellHolding } from "../fixtures/shell-markup.js";
import { shellView } from "../fixtures/shell-view.js";

const CHILD =
  '<assembly-root data-id="b" data-name="inner"><p id="child">from another renderer</p></assembly-root>';

// The shell's envelope as the server sent it, a child where the directive stood, not yet mounted.
const shell = (child: string) => {
  const element = document.createElement("assembly-root");
  document.body.append(element);
  element.innerHTML = shellHolding(child);
  const bus = createBus();
  const pressed: string[] = [];
  bus
    .forAssembly({ id: "o", name: "observer", view: "default" })
    .events.on("pressed", (message) => pressed.push(message.from.name));
  const { events } = bus.forAssembly({ id: "a", name: "shell", view: "default" });
  const mount = () =>
    hydrate(shellView).mount(element, {}, { id: "a", name: "shell", view: "default", events });
  return { element, events, mount, pressed };
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("placing a child assembly in a Lit view", () => {
  it("hydrates around the child the composer put where the directive stood", () => {
    const { element, mount, pressed } = shell(CHILD);
    const child = element.querySelector("#child");
    expect(child).not.toBeNull();
    mount();
    // The same directive on both sides, so the template Lit hydrates is the one it rendered,
    // and what stands in the slot now is the child's own and is left as it is.
    expect(element.querySelector("#child")).toBe(child);
    element.querySelector("button")?.click();
    expect(pressed).toEqual(["shell"]);
  });

  it("writes nothing into the slot when the view renders again", () => {
    const { element, events, mount } = shell(CHILD);
    const child = element.querySelector("#child");
    mount();
    render(shellView({ data: {}, events }), element);
    expect(element.querySelector("#child")).toBe(child);
    expect(child?.isConnected).toBe(true);
  });

  it("holds a Lit child in the child's own shadow root, where its markers are out of sight", () => {
    const { element, mount } = shell('<assembly-root data-id="b"></assembly-root>');
    const inner = element.querySelector('[data-id="b"]');
    if (inner === null) throw new Error("the child's envelope is not in the slot");
    const root = inner.attachShadow({ mode: "open" });
    root.innerHTML = BUTTON_MARKUP;
    const server = root.querySelector("button");
    mount();
    const { events } = createBus().forAssembly({ id: "b", name: "button", view: "default" });
    hydrate(buttonView).mount(
      root,
      { label: "Press" },
      { id: "b", name: "button", view: "default", events },
    );
    expect(root.querySelector("button")).toBe(server);
  });
});
