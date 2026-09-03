// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { MarkupInput } from "@assemblejs/core";

describe("what producing markup is given", () => {
  it("receives children already rendered, as strings", () => {
    const input: MarkupInput = { data: { total: 2 }, children: { inner: "<p>x</p>" } };
    expect(typeof input.children["inner"]).toBe("string");
  });
});
