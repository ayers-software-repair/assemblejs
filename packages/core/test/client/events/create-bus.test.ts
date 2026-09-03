// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it, vi } from "vitest";
import { createBus } from "@assemblejs/core/client";

const catalogue = { id: "c1", name: "catalogue", view: "default" };
const cart = { id: "c2", name: "cart", view: "default" };
const otherCart = { id: "c3", name: "cart", view: "compact" };

describe("sending and receiving", () => {
  it("delivers to everyone subscribed to the topic", () => {
    const bus = createBus();
    const a = bus.forAssembly(catalogue);
    const b = bus.forAssembly(cart);
    const heard = vi.fn();
    b.events.on("cart:add", heard);
    a.events.send("cart:add", { sku: "x" });
    expect(heard).toHaveBeenCalledOnce();
  });

  it("does not deliver a different topic", () => {
    const bus = createBus();
    const heard = vi.fn();
    bus.forAssembly(cart).events.on("cart:add", heard);
    bus.forAssembly(catalogue).events.send("cart:remove", {});
    expect(heard).not.toHaveBeenCalled();
  });

  it("stamps the sender from what the runtime knows, not from the caller", () => {
    const bus = createBus();
    let seen: string | undefined;
    bus.forAssembly(cart).events.on("cart:add", (message) => {
      seen = message.from.name;
    });
    // A bus where anyone can claim to be anyone is a bus with no addressing at all.
    bus.forAssembly(catalogue).events.send("cart:add", { from: "i am the cart" });
    expect(seen).toBe("catalogue");
  });

  it("numbers messages so two are always orderable", () => {
    const bus = createBus();
    const { events } = bus.forAssembly(catalogue);
    expect(events.send("t", 1).seq).toBeLessThan(events.send("t", 2).seq);
  });
});

describe("addressing", () => {
  it("reaches one assembly by name, and both instances of that name", () => {
    const bus = createBus();
    const first = vi.fn();
    const second = vi.fn();
    const other = vi.fn();
    bus.forAssembly(cart).events.on("t", first);
    bus.forAssembly(otherCart).events.on("t", second);
    bus.forAssembly(catalogue).events.on("t", other);

    bus.forAssembly(catalogue).events.send("t", {}, { name: "cart" });
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(other).not.toHaveBeenCalled();
  });

  it("reaches exactly one instance by id", () => {
    const bus = createBus();
    const first = vi.fn();
    const second = vi.fn();
    bus.forAssembly(cart).events.on("t", first);
    bus.forAssembly(otherCart).events.on("t", second);

    bus.forAssembly(catalogue).events.send("t", {}, { id: cart.id });
    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
  });
});

describe("replay", () => {
  it("keeps nothing unless the topic was declared to keep it", () => {
    const bus = createBus();
    bus.forAssembly(catalogue).events.send("cart:add", { sku: "x" });
    expect(bus.forAssembly(cart).events.last("cart:add")).toBeUndefined();
  });

  // The real race: an assembly that hydrates late missing a message sent before it existed.
  it("lets a late assembly read the last message on a declared topic", () => {
    const bus = createBus(["cart:add"]);
    bus.forAssembly(catalogue).events.send("cart:add", { sku: "x" });
    const late = bus.forAssembly(cart);
    expect(late.events.last<{ sku: string }>("cart:add")?.payload).toEqual({ sku: "x" });
  });

  it("keeps only the last one, not a history nobody reads", () => {
    const bus = createBus(["t"]);
    const { events } = bus.forAssembly(catalogue);
    events.send("t", 1);
    events.send("t", 2);
    expect(bus.forAssembly(cart).events.last<number>("t")?.payload).toBe(2);
  });
});

describe("unsubscribing", () => {
  it("removes exactly the handler it was returned for", () => {
    const bus = createBus();
    const { events } = bus.forAssembly(cart);
    const kept = vi.fn();
    events.on("t", kept);
    const off = events.on("t", vi.fn());
    expect(bus.size).toBe(2);
    off();
    expect(bus.size).toBe(1);
    bus.forAssembly(catalogue).events.send("t", {});
    expect(kept).toHaveBeenCalledOnce();
  });

  it("removes exactly this assembly's subscriptions on release, and no others", () => {
    const bus = createBus();
    const mine = bus.forAssembly(cart);
    const theirs = bus.forAssembly(catalogue);
    mine.events.on("t", vi.fn());
    mine.events.on("u", vi.fn());
    const kept = vi.fn();
    theirs.events.on("t", kept);
    expect(bus.size).toBe(3);

    mine.release();
    expect(bus.size).toBe(1);
    bus.forAssembly(otherCart).events.send("t", {});
    expect(kept).toHaveBeenCalledOnce();
  });

  // The leak test the ladder names: a hundred mount and unmount cycles must return the bus to
  // exactly where it started. Forgetting to unsubscribe has to be impossible, not discouraged.
  it("returns the bus to its starting size after a hundred cycles", () => {
    const bus = createBus(["t"]);
    const resident = bus.forAssembly(catalogue);
    resident.events.on("t", vi.fn());
    const before = bus.size;

    for (let cycle = 0; cycle < 100; cycle += 1) {
      const held = bus.forAssembly({ id: `x${cycle}`, name: "cart", view: "default" });
      held.events.on("t", vi.fn());
      held.events.on("u", vi.fn());
      held.events.send("t", cycle);
      held.release();
    }
    expect(bus.size).toBe(before);
  });
});

describe("a handler that changes the subscriptions while it runs", () => {
  it("does not disturb the delivery it is part of", () => {
    const bus = createBus();
    const { events } = bus.forAssembly(cart);
    const later = vi.fn();
    events.on("t", () => {
      events.on("t", later);
    });
    bus.forAssembly(catalogue).events.send("t", {});
    // The handler added during delivery is not called for the message being delivered.
    expect(later).not.toHaveBeenCalled();
    bus.forAssembly(catalogue).events.send("t", {});
    expect(later).toHaveBeenCalledOnce();
  });
});
