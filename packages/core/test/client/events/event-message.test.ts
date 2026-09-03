// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { EventMessage } from "@assemblejs/core/client";

describe("a message", () => {
  it("carries its sender and a sequence, so two are always orderable", () => {
    const message: EventMessage<{ sku: string }> = {
      topic: "cart:add",
      payload: { sku: "a" },
      from: { id: "a7f3", name: "catalogue", view: "default" },
      to: "all",
      seq: 1,
    };
    expect(message.from.name).toBe("catalogue");
    expect(message.seq).toBe(1);
  });
});
