// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DescribedContract } from "@assemblejs/mcp";

describe("the contract as an agent reads it", () => {
  it("holds the envelope's island as the server writes it", () => {
    const envelope: DescribedContract["envelope"]["island"] = {
      element: "script",
      type: "application/json",
      attribute: "data-assembly",
    };
    expect(envelope.element).toBe("script");
  });
});
