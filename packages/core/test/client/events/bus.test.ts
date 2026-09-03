// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";

describe("the page's bus", () => {
  it("reports how many handlers are subscribed", () => {
    const bus = createBus();
    expect(bus.size).toBe(0);
    const { events } = bus.forAssembly({ id: "1", name: "cart", view: "default" });
    events.on("cart:add", () => {});
    expect(bus.size).toBe(1);
  });
});
