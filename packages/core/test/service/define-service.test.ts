// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineService } from "@assemblejs/core";

describe("declaring a service", () => {
  it("returns what it was given and infers the data's shape", async () => {
    const greeting = defineService({
      name: "greeting",
      run: () => ({ greeting: "hello" }),
    });
    const data = await greeting.run({ query: new URLSearchParams(), params: {} });
    expect(data.greeting).toBe("hello");
  });
});
