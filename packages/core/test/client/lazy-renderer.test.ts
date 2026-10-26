// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBus, lazyRenderer } from "@asmjs/core/client";
import type { ClientRenderer, MountContext } from "@asmjs/core/client";

const context = (name: string): MountContext => ({
  id: `${name}-1`,
  name,
  view: "default",
  events: createBus([]).forAssembly({ id: `${name}-1`, name, view: "default" }).events,
});

const recording = () => {
  const calls: string[] = [];
  const half: ClientRenderer = {
    mount: (_element, data, ctx) => {
      calls.push(`mount ${ctx.name} ${JSON.stringify(data)}`);
      return { unmount: () => calls.push(`unmount ${ctx.name}`) };
    },
  };
  return { calls, half };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("loading each assembly's module when it mounts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads only the module of the assembly being mounted, then mounts it", async () => {
    const { calls, half } = recording();
    const loaded: string[] = [];
    const renderer = lazyRenderer({
      counter: async () => {
        loaded.push("counter");
        return { default: half };
      },
      readout: async () => {
        loaded.push("readout");
        return { default: half };
      },
    });
    renderer.mount(document.createElement("div"), { n: 1 }, context("counter"));
    await settle();
    expect(loaded).toEqual(["counter"]);
    expect(calls).toEqual(['mount counter {"n":1}']);
  });

  it("never mounts an assembly unmounted before its module arrived", async () => {
    const { calls, half } = recording();
    const renderer = lazyRenderer({ counter: async () => ({ default: half }) });
    renderer.mount(document.createElement("div"), {}, context("counter")).unmount();
    await settle();
    expect(calls).toEqual([]);
  });

  it("unmounts what it mounted", async () => {
    const { calls, half } = recording();
    const renderer = lazyRenderer({ counter: async () => ({ default: half }) });
    const handle = renderer.mount(document.createElement("div"), {}, context("counter"));
    await settle();
    handle.unmount();
    expect(calls).toEqual(["mount counter {}", "unmount counter"]);
  });

  it("warns and does nothing for an assembly this build has no module for", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const renderer = lazyRenderer({});
    const handle = renderer.mount(document.createElement("div"), {}, context("constructor"));
    expect(() => handle.unmount()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"constructor"'));
  });

  // The handle is back at once and the mount happens later, so the handle says when.
  it("says when the assembly is live: once its module has arrived and mounted", async () => {
    const { calls, half } = recording();
    const renderer = lazyRenderer({ counter: async () => ({ default: half }) });
    const handle = renderer.mount(document.createElement("div"), {}, context("counter"));
    expect(calls).toEqual([]);
    expect(handle.mounted).toBeInstanceOf(Promise);
    await handle.mounted;
    expect(calls).toEqual(["mount counter {}"]);
  });

  it("says it will not be live where the module fails, its mount throws, or there is none", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const throwing: ClientRenderer = {
      mount: () => {
        throw new Error("the component threw");
      },
    };
    const renderer = lazyRenderer({
      broken: () => Promise.reject(new Error("404")),
      throwing: async () => ({ default: throwing }),
    });
    for (const name of ["broken", "throwing", "absent"]) {
      const handle = renderer.mount(document.createElement("div"), {}, context(name));
      await expect(handle.mounted, name).rejects.toBeDefined();
    }
  });

  it("reports a module that fails to load against the assembly, and does not throw", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const renderer = lazyRenderer({ broken: () => Promise.reject(new Error("404")) });
    renderer.mount(document.createElement("div"), {}, context("broken"));
    await settle();
    expect(error).toHaveBeenCalledWith('assemblejs: "broken" did not mount', expect.any(Error));
  });
});
