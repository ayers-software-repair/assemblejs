// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ContractTerm } from "@asmjs/mcp";

describe("one term of the contract", () => {
  it("is a name the server writes and what it means", () => {
    const term: ContractTerm = { name: "assembly-page", meaning: "the page being composed" };
    expect(Object.keys(term)).toEqual(["name", "meaning"]);
  });
});
