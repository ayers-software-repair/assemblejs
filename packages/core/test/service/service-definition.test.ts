// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ServiceDefinition } from "@assemblejs/core";

describe("a service", () => {
  it("returns its data rather than mutating anything", async () => {
    const greeting: ServiceDefinition<{ greeting: string }> = {
      name: "greeting",
      run: ({ query }) => ({ greeting: `Hello, ${query.get("name") ?? "world"}` }),
    };
    // Callable on its own, with nothing around it, which is what returning buys.
    expect(await greeting.run({ query: new URLSearchParams("name=ada"), params: {} })).toEqual({
      greeting: "Hello, ada",
    });
  });

  it("says what it must follow by name, never by a number", () => {
    const after: ServiceDefinition = { name: "b", after: ["a"], run: () => ({}) };
    // A priority number is a claim about every other service made by someone who can see one.
    expect(after.after).toEqual(["a"]);
    expect(Object.keys(after)).not.toContain("priority");
  });
});
