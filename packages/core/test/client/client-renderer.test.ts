// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";
import type { ClientRenderer } from "@assemblejs/core/client";

describe("a client renderer", () => {
  it("mounts into the element it is given and returns a handle", () => {
    let mountedInto: Element | undefined;
    const element = {} as Element;
    const client: ClientRenderer = {
      mount: (el, _data, _context) => {
        mountedInto = el;
        return { unmount: () => (mountedInto = undefined) };
      },
    };
    const sender = { id: "a7f3", name: "cart", view: "default" };
    const { events } = createBus().forAssembly(sender);
    const handle = client.mount(element, {}, { ...sender, events });
    // The adapter never looks its own root up: a lookup that misses fails silently.
    expect(mountedInto).toBe(element);
    handle.unmount();
    expect(mountedInto).toBeUndefined();
  });
});
