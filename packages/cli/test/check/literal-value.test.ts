// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { LiteralValue } from "@assemblejs/cli";

describe("a value as written in source", () => {
  it("is a string, a number, a boolean, null, an object or an array of them, or undefined when computed", () => {
    const value: LiteralValue = {
      remotes: [{ origin: "https://a.example", forward: undefined, deadline: 800, defer: true }],
      none: null,
    };
    expect(JSON.stringify(value)).toContain("https://a.example");
  });
});
