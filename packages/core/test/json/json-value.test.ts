// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { JsonValue } from "@assemblejs/core";

describe("JsonValue", () => {
  it("admits every shape that survives a round trip, and nests", () => {
    const value: JsonValue = ["a", 1, true, null, { nested: [{ deep: 1 }] }];
    expect(JSON.parse(JSON.stringify(value))).toEqual(value);
  });
});
