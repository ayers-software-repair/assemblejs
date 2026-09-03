// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";
import type { Events } from "@assemblejs/core/client";

describe("what one assembly holds", () => {
  it("is send, on and last, and nothing that dispatches raw events", () => {
    const { events } = createBus().forAssembly({ id: "1", name: "cart", view: "default" });
    const surface: Events = events;
    expect(Object.keys(surface).sort()).toEqual(["last", "on", "send"]);
  });
});
