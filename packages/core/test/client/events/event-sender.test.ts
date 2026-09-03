// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { EventSender } from "@assemblejs/core/client";

describe("who sent a message", () => {
  it("is the assembly's identity, which the runtime stamps", () => {
    const sender: EventSender = { id: "a7f3", name: "cart", view: "default" };
    expect(Object.keys(sender).sort()).toEqual(["id", "name", "view"]);
  });
});
