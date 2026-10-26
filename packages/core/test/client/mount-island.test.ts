// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBus, mountIsland } from "@asmjs/core/client";
import type { ClientRenderer, Events } from "@asmjs/core/client";

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

  it("releases only the failed assembly's subscriptions when readiness rejects, preserving its handle", async () => {
    const bus = createBus();
    const sibling = bus.forAssembly({ ...payload, id: "cart-2" });
    const kept = vi.fn();
    sibling.events.on("cart:changed", kept);
    const heard = vi.fn();
    const failure = new Error("the renderer could not become ready");
    let fail = (_reason: unknown): void => undefined;
    const mounted = new Promise<void>((_resolve, reject) => (fail = reject));
    const handle = { unmount: vi.fn(), mounted };
    let events: Events | undefined;
    const renderer: ClientRenderer = {
      mount: (_element, _data, context) => {
        events = context.events;
        events.on("cart:changed", heard);
        events.on("cart:emptied", heard);
        return handle;
      },
    };
    const island = mountIsland(renderer, document.createElement("div"), payload, bus);
    expect(island?.handle).toBe(handle);
    expect(island?.handle.mounted).toBe(mounted);
    await Promise.resolve();
    sibling.events.send("cart:changed", {});
    expect(heard).toHaveBeenCalledOnce();
    expect(bus.size).toBe(3);

    fail(failure);
    await expect(island?.handle.mounted).rejects.toBe(failure);
    expect(bus.size).toBe(1);
    // Work still finishing after failure cannot subscribe again through the released scope.
    events?.on("cart:changed", heard);
    sibling.events.send("cart:changed", {});
    sibling.events.send("cart:emptied", {});
    expect(heard).toHaveBeenCalledOnce();
    expect(kept).toHaveBeenCalledTimes(2);
    island?.release();
    island?.release();
    expect(bus.size).toBe(1);
    expect(handle.unmount).not.toHaveBeenCalled();
    sibling.release();
    expect(bus.size).toBe(0);
  });

  it("keeps delivering while readiness is pending and after it succeeds, until released", async () => {
    const bus = createBus();
    const sender = bus.forAssembly({ id: "catalogue-1", name: "catalogue", view: "default" });
    const heard = vi.fn();
    let live = (): void => undefined;
    const mounted = new Promise<void>((resolve) => (live = resolve));
    const renderer: ClientRenderer = {
      mount: (_element, _data, context) => {
        context.events.on("cart:changed", heard);
        return { unmount: () => undefined, mounted };
      },
    };
    const island = mountIsland(renderer, document.createElement("div"), payload, bus);
    await Promise.resolve();
    sender.events.send("cart:changed", {});
    expect(heard).toHaveBeenCalledOnce();
    live();
    await island?.handle.mounted;
    sender.events.send("cart:changed", {});
    expect(heard).toHaveBeenCalledTimes(2);
    expect(bus.size).toBe(1);
    island?.release();
    island?.release();
    sender.events.send("cart:changed", {});
    expect(heard).toHaveBeenCalledTimes(2);
    expect(bus.size).toBe(0);
  });
});
