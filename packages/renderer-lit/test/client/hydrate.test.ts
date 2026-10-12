// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createBus } from "@assemblejs/core/client";
import { beforeEach, describe, expect, it } from "vitest";
import { hydrate } from "@assemblejs/renderer-lit/client";
import { BUTTON_MARKUP } from "../fixtures/button-markup.js";
import { buttonView } from "../fixtures/button-view.js";
import { shellHolding } from "../fixtures/shell-markup.js";
import { shellView } from "../fixtures/shell-view.js";
import { STEPS_MARKUP } from "../fixtures/steps-markup.js";
import { stepsView } from "../fixtures/steps-view.js";
import type { ProbeSteps } from "../fixtures/steps-view.js";

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

// A view's module defines its elements before the view hydrates, so an element left to hydrate
// as soon as it is defined rendered from what its constructor set: against the list the server
// sent, Lit threw "shorter than expected iterable" and the list was rendered twice.
describe("an element whose list the view sets", () => {
  /** The page as the browser parsed it: each declared shadow root attached to its element. */
  const parsed = (markup: string): HTMLElement => {
    const element = document.createElement("assembly-root");
    document.body.append(element);
    element.innerHTML = markup;
    for (const declared of element.querySelectorAll("template[shadowrootmode]")) {
      const root = (declared.parentElement as HTMLElement).attachShadow({ mode: "open" });
      root.append((declared as HTMLTemplateElement).content);
      declared.remove();
    }
    return element;
  };
  const mount = (element: HTMLElement) => {
    const { events } = createBus().forAssembly({ id: "a", name: "steps", view: "default" });
    return hydrate(stepsView).mount(
      element,
      { steps: ["light", "dark"] },
      { id: "a", name: "steps", view: "default", events },
    );
  };

  it("hydrates once the view has given it the list, adopting what the server sent", async () => {
    const element = parsed(STEPS_MARKUP);
    const steps = element.querySelector("probe-steps") as ProbeSteps;
    const server = [...(steps.shadowRoot?.querySelectorAll("li") ?? [])];
    expect(server).toHaveLength(2);
    // Defined, and so upgraded, before the view hydrates: it holds off, and renders nothing.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect([...(steps.shadowRoot?.querySelectorAll("li") ?? [])]).toEqual(server);
    expect(steps.hasAttribute("defer-hydration")).toBe(true);

    mount(element);
    await steps.updateComplete;
    expect(steps.hasAttribute("defer-hydration")).toBe(false);
    expect(steps.steps).toEqual(["light", "dark"]);
    expect([...(steps.shadowRoot?.querySelectorAll("li") ?? [])]).toEqual(server);

    // Live: what the view's property says next is what it shows.
    steps.steps = ["light", "medium", "dark"];
    await steps.updateComplete;
    expect(steps.shadowRoot?.querySelectorAll("li")).toHaveLength(3);
  });
});

// Lit reads every marker in the tree it hydrates. Left to itself it throws on a child's bound
// attribute with a message about conditional rendering, and takes a child that binds nothing for
// its own, removing it the next time the view renders. So the refusal is this package's.
describe("a Lit view holding a Lit assembly in its own tree", () => {
  const mountHolding = (markup: string) => {
    const element = document.createElement("assembly-root");
    document.body.append(element);
    element.innerHTML = shellHolding(
      `<assembly-root data-id="b" data-name="badge">${markup}</assembly-root>`,
    );
    const child = element.querySelector('[data-id="b"]')?.innerHTML;
    const { events } = createBus().forAssembly({ id: "a", name: "shell", view: "default" });
    const mount = () =>
      hydrate(shellView).mount(element, {}, { id: "a", name: "shell", view: "default", events });
    return { element, child, mount };
  };

  it("is refused by name, with what to do about it, before Lit reads a marker", () => {
    const { element, child, mount } = mountHolding(BUTTON_MARKUP);
    expect(mount).toThrow(
      /the Lit view of "shell" cannot hold the Lit assembly "badge" in its own tree.*export const shadow = true/s,
    );
    // Nothing was hydrated: the child is as the server sent it, for its own mount.
    expect(element.querySelector('[data-id="b"]')?.innerHTML).toBe(child);
  });

  it("is refused when its template binds nothing, where Lit would say nothing", () => {
    const { mount } = mountHolding("<!--lit-part AAAA--><p>plain</p><!--/lit-part-->");
    expect(mount).toThrow(/cannot hold the Lit assembly "badge"/);
  });
});
