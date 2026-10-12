// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBus, mountIsland } from "@assemblejs/core/client";
import type { ClientRenderer } from "@assemblejs/core/client";

const payload = {
  id: "cart-1",
  name: "cart",
  view: "default",
  renderer: "html",
  data: { items: 2 },
  deferred: false,
} as const;

describe("mounting one assembly's browser half", () => {
  afterEach(() => vi.restoreAllMocks());

  it("hands the renderer the element, the data and events that are the assembly's own", () => {
    const bus = createBus();
    const seen: unknown[] = [];
    const renderer: ClientRenderer = {
      mount: (element, data, context) => {
        seen.push(element, data, context.id, context.name, context.view);
        context.events.on("cart:changed", () => undefined);
        return { unmount: () => undefined };
      },
    };
    const element = document.createElement("div");
    const island = mountIsland(renderer, element, payload, bus);
    expect(seen).toEqual([element, { items: 2 }, "cart-1", "cart", "default"]);
    expect(bus.size).toBe(1);
    island?.release();
    expect(bus.size).toBe(0);
  });

  it("mounts inside the shadow root of an assembly that has one", () => {
    const into: Array<Element | ShadowRoot> = [];
    const renderer: ClientRenderer = {
      mount: (element) => {
        into.push(element);
        return { unmount: () => undefined };
      },
    };
    const element = document.createElement("div");
    const root = element.attachShadow({ mode: "open" });
    mountIsland(renderer, element, payload, createBus());
    expect(into).toEqual([root]);
  });

  // A mount that threw part-way had already subscribed, and what it subscribed stayed live on
  // the page's bus, called for every message, for an assembly that never mounted.
  it("answers nothing for a mount that throws, says so by name, and leaves none of its subscriptions", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const bus = createBus();
    const renderer: ClientRenderer = {
      mount: (_element, _data, context) => {
        context.events.on("cart:changed", () => undefined);
        context.events.on("cart:emptied", () => undefined);
        throw new Error("the component threw");
      },
    };
    expect(mountIsland(renderer, document.createElement("div"), payload, bus)).toBeUndefined();
    expect(bus.size).toBe(0);
    expect(error).toHaveBeenCalledWith('assemblejs: "cart" did not mount', expect.any(Error));
  });
});
