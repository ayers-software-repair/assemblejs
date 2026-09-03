// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
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
    const handle = client.mount(element, {}, { id: "a7f3", name: "cart", view: "default" });
    // The adapter never looks its own root up: a lookup that misses fails silently.
    expect(mountedInto).toBe(element);
    handle.unmount();
    expect(mountedInto).toBeUndefined();
  });
});
