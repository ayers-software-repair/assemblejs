// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DeclaredAddresses } from "@assemblejs/check";

describe("the addresses a config declares", () => {
  it("are the routes with their addresses, whether those are all of them, and what was wrong", () => {
    const declared: DeclaredAddresses = {
      addresses: { "/p/:sku": "/p/kettle-1" },
      whole: true,
      problems: [],
    };
    expect(Object.keys(declared)).toEqual(["addresses", "whole", "problems"]);
  });
});
