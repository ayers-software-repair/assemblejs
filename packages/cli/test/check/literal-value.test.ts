// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { LiteralValue } from "@assemblejs/cli";

describe("a value as written in source", () => {
  it("is a string, an object or an array of them, or null when it is computed", () => {
    const value: LiteralValue = { remotes: [{ origin: "https://a.example", forward: null }] };
    expect(JSON.stringify(value)).toContain("https://a.example");
  });
});
