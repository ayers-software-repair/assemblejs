// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PageBudgets } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { PAGE_PARTS } from "@assemblejs/cli";

describe("the parts of what a page sends", () => {
  it("are the parts a budget can name, no more and no fewer", () => {
    const every: Required<PageBudgets> = { document: 1, styles: 1, scripts: 1 };
    expect([...PAGE_PARTS].sort()).toEqual(Object.keys(every).sort());
  });
});
