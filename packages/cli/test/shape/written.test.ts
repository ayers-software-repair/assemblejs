// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Written } from "@assemblejs/cli";

describe("a value as its source writes it", () => {
  it("is carried whole by JSON, at any depth", () => {
    const written: Written = {
      defer: true,
      timeout: 800,
      fallback: null,
      forward: ["cookie", "(computed)"],
      "...": "(computed)",
    };
    expect(JSON.parse(JSON.stringify(written))).toEqual(written);
  });
});
