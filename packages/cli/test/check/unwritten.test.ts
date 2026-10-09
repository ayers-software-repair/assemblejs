// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { parse } from "acorn";
import type { Expression, ExpressionStatement } from "acorn";
import { describe, expect, it } from "vitest";
import { UNWRITTEN, literalOf } from "@assemblejs/cli";

describe("the mark on an object whose keys are not all written", () => {
  it("is a symbol beside the entries, which a walk over the entries never meets", () => {
    const [statement] = parse("({ a: 1, ...rest })", { ecmaVersion: "latest" }).body;
    const read = literalOf((statement as ExpressionStatement).expression as Expression);
    expect(read !== null && typeof read === "object" && UNWRITTEN in read).toBe(true);
    expect(Object.entries(read as object)).toEqual([["a", 1]]);
  });
});
