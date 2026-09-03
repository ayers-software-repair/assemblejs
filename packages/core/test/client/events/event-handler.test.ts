// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { EventHandler } from "@assemblejs/core/client";

describe("a handler", () => {
  it("is called with the whole message, not just the payload", () => {
    let seen = "";
    const handler: EventHandler<{ sku: string }> = (message) => {
      seen = `${message.from.name}:${message.payload.sku}`;
    };
    handler({
      topic: "cart:add",
      payload: { sku: "a" },
      from: { id: "1", name: "catalogue", view: "default" },
      to: "all",
      seq: 1,
    });
    expect(seen).toBe("catalogue:a");
  });
});
