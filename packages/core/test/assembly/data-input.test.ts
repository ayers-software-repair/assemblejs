// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DataInput } from "@assemblejs/core";

describe("what producing data is given", () => {
  it("is the assembly's own query and nothing of the page's", () => {
    const input: DataInput = { query: new URLSearchParams("sku=1") };
    expect(Object.keys(input)).toEqual(["query"]);
  });
});
