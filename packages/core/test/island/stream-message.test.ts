// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { StreamMessage } from "@assemblejs/core";

describe("a message on a page's stream", () => {
  it("is a topic, a JSON payload, and the assemblies it is for when not every one", () => {
    const message: StreamMessage = { topic: "price", payload: { sku: "a" }, to: { name: "cart" } };
    expect(JSON.parse(JSON.stringify(message))).toEqual(message);
  });
});
