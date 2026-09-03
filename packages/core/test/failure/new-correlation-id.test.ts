// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { newCorrelationId } from "@assemblejs/core";

describe("a correlation id", () => {
  it("is short enough to read down a phone", () => {
    expect(newCorrelationId()).toMatch(/^[0-9a-f]{8}$/);
  });

  it("does not repeat", () => {
    const seen = new Set(Array.from({ length: 500 }, () => newCorrelationId()));
    expect(seen.size).toBe(500);
  });
});
