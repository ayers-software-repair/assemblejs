// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { JsonObject } from "@assemblejs/core";

describe("JsonObject", () => {
  it("is the only shape that crosses to the browser, so it round trips whole", () => {
    const data: JsonObject = { greeting: "hello", count: 2, items: [{ sku: "a" }] };
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });
});
