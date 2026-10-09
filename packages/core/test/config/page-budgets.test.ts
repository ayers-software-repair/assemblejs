// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PageBudgets } from "@assemblejs/core";

describe("what a page may send a visitor", () => {
  it("is a gzipped byte count per part, each optional", () => {
    const budgets: PageBudgets = { document: 20000, scripts: 60000 };
    expect(budgets.styles).toBeUndefined();
    expect(Object.keys(budgets).sort()).toEqual(["document", "scripts"]);
  });
});
