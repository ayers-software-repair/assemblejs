// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PageBudgets } from "@assemblejs/core";
import { formatSize } from "./format-size.js";
import { PAGE_PARTS } from "./page-parts.js";
import type { PageWeight } from "./page-weight.js";

/** Each part of a page's weight that is over the budget declared for it, gzipped, as a sentence. */
export function overBudget(weight: PageWeight, budgets: PageBudgets): readonly string[] {
  const over: string[] = [];
  for (const part of PAGE_PARTS) {
    const budget = budgets[part];
    if (budget !== undefined && weight[part].gzip > budget) {
      over.push(
        `${part} is ${formatSize(weight[part].gzip)} gzipped, over its budget of ${formatSize(budget)}`,
      );
    }
  }
  return over;
}
