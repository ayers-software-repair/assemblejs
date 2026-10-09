// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineConfig } from "@assemblejs/core";

describe("declaring a project's policy", () => {
  it("returns the declaration unchanged", () => {
    const config = { remotes: [{ origin: "https://checkout.example.com" }] };
    expect(defineConfig(config)).toBe(config);
  });
});
