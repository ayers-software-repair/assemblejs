// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { lazyRenderer, markMounted, start } from "@assemblejs/core/client";
import type { ClientRenderer } from "@assemblejs/core/client";

const MARK = "data-mounted";
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const always = (): boolean => true;

describe("the mark that says an assembly is live", () => {
  it("is written at once for a mount that is live when it returns", () => {
    const element = document.createElement("div");
    markMounted(element, { unmount: () => undefined }, always);
    expect(element.hasAttribute(MARK)).toBe(true);
  });

  it("waits for a mount that says it is live later, and is written then", async () => {
    const element = document.createElement("div");
    let live = (): void => undefined;
    const mounted = new Promise<void>((resolve) => (live = resolve));
    markMounted(element, { unmount: () => undefined, mounted }, always);
    await settle();
    expect(element.hasAttribute(MARK)).toBe(false);
    live();
    await settle();
    expect(element.hasAttribute(MARK)).toBe(true);
  });

  it("is never written for a mount that says it will not be live", async () => {
    const element = document.createElement("div");
    markMounted(
      element,
      { unmount: () => undefined, mounted: Promise.reject(new Error("no module")) },
      always,
    );
    await settle();
    expect(element.hasAttribute(MARK)).toBe(false);
  });

  it("is not written for an assembly no longer held when its mount goes live", async () => {
    const element = document.createElement("div");
    markMounted(element, { unmount: () => undefined, mounted: Promise.resolve() }, () => false);
    await settle();
    expect(element.hasAttribute(MARK)).toBe(false);
  });
});

// Every built project mounts through the renderer that loads each assembly's module when it is
// due. The mark was written when that renderer handed back its handle, before any module had
// arrived, and stayed where one never did.
describe("the mark, through the runtime, for an assembly whose module is loaded when it mounts", () => {
  const page = (name: string): Element => {
    const root = document.createElement("div");
    root.innerHTML = `<assembly-root data-id="${name}-1" data-name="${name}" data-view="default" data-renderer="html"><script type="application/json" data-assembly="${name}-1">{"id":"${name}-1","name":"${name}","view":"default","renderer":"html","data":{},"deferred":false}</script></assembly-root>`;
    return root;
  };
  const half: ClientRenderer = { mount: () => ({ unmount: () => undefined }) };
  afterEach(() => vi.restoreAllMocks());

  it("is written when the module has arrived and mounted, and not before", async () => {
    let arrive = (): void => undefined;
    const arrived = new Promise<void>((resolve) => (arrive = resolve));
    const renderer = lazyRenderer({ cart: () => arrived.then(() => ({ default: half })) });
    const root = page("cart");
    start({ renderers: { html: renderer }, root });
    await settle();
    expect(root.querySelector(`[${MARK}]`)).toBeNull();
    arrive();
    await settle();
    expect(root.querySelector(`[${MARK}]`)).not.toBeNull();
  });

  it("is never written where the module does not load, where its mount throws, or where there is none", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const throwing: ClientRenderer = {
      mount: () => {
        throw new Error("the component threw");
      },
    };
    for (const [name, modules] of [
      ["gone", { gone: () => Promise.reject(new Error("404")) }],
      ["throws", { throws: async () => ({ default: throwing }) }],
      ["absent", {}],
    ] as const) {
      const root = page(name);
      start({ renderers: { html: lazyRenderer(modules) }, root });
      await settle();
      expect(root.querySelector(`[${MARK}]`), name).toBeNull();
    }
  });

  it.each(["lazy throw", "readiness rejection"])(
    "releases a failed mount's listeners and keeps its healthy sibling live after a %s",
    async (mode) => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const failure = new Error("the component did not mount");
      const heard: string[] = [];
      const unmount = vi.fn();
      const subscribing: ClientRenderer = {
        mount: (_element, _data, context) => {
          context.events.on("ping", () => heard.push(context.name));
          if (context.name === "broken") {
            if (mode === "lazy throw") throw failure;
            return { unmount: () => undefined, mounted: Promise.reject(failure) };
          }
          return { unmount, mounted: Promise.resolve() };
        },
      };
      const renderer =
        mode === "lazy throw"
          ? lazyRenderer({
              broken: async () => ({ default: subscribing }),
              healthy: async () => ({ default: subscribing }),
            })
          : subscribing;
      const root = page("broken");
      root.append(page("healthy"));
      const runtime = start({ renderers: { html: renderer }, root });
      await expect(runtime.mounted.get("broken-1")?.handle.mounted).rejects.toBe(failure);
      await runtime.mounted.get("healthy-1")?.handle.mounted;

      expect(root.querySelector(`[data-id="broken-1"][${MARK}]`)).toBeNull();
      expect(root.querySelector(`[data-id="healthy-1"][${MARK}]`)).not.toBeNull();
      const sender = runtime.bus.forAssembly({ id: "outside", name: "outside", view: "default" });
      sender.events.send("ping", {});
      expect(heard).toEqual(["healthy"]);
      expect(runtime.bus.size).toBe(1);

      runtime.unmountAll();
      runtime.unmountAll();
      sender.events.send("ping", {});
      expect(heard).toEqual(["healthy"]);
      expect(runtime.bus.size).toBe(0);
      expect(runtime.mounted.size).toBe(0);
      expect(root.querySelector(`[${MARK}]`)).toBeNull();
      expect(unmount).toHaveBeenCalledOnce();
    },
  );

  it("is not written for an assembly unmounted before its module arrived", async () => {
    let arrive = (): void => undefined;
    const arrived = new Promise<void>((resolve) => (arrive = resolve));
    const renderer = lazyRenderer({ cart: () => arrived.then(() => ({ default: half })) });
    const root = page("cart");
    start({ renderers: { html: renderer }, root }).unmountAll();
    arrive();
    await settle();
    expect(root.querySelector(`[${MARK}]`)).toBeNull();
  });
});
