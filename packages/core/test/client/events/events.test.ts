// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createBus } from "@asmjs/core/client";
import type { Events } from "@asmjs/core/client";

describe("what one assembly holds", () => {
  it("is send, on, last and keep, and nothing that dispatches raw events", () => {
    const { events } = createBus().forAssembly({ id: "1", name: "cart", view: "default" });
    const surface: Events = events;
    expect(Object.keys(surface).sort()).toEqual(["keep", "last", "on", "send"]);
  });

  it("lets one assembly keep a topic for another to read with last", () => {
    const bus = createBus();
    const cart = bus.forAssembly({ id: "c1", name: "cart", view: "default" }).events;
    const late = bus.forAssembly({ id: "l1", name: "late", view: "default" }).events;
    cart.keep("cart:add");
    cart.send("cart:add", { sku: "x" });
    cart.send("cart:other", { sku: "y" });
    const message = late.last<{ sku: string }>("cart:add");
    expect(message?.payload).toEqual({ sku: "x" });
    expect(message?.from.id).toBe("c1");
    expect(late.last("cart:other")).toBeUndefined();
  });

  it("keeps only what is sent after keep is called", () => {
    const bus = createBus();
    const cart = bus.forAssembly({ id: "c1", name: "cart", view: "default" }).events;
    cart.send("price", 1);
    cart.keep("price");
    expect(cart.last("price")).toBeUndefined();
    cart.send("price", 2);
    expect(cart.last("price")?.payload).toBe(2);
  });
});
