// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { overBudget } from "@assemblejs/cli";
import type { PageWeight } from "@assemblejs/cli";

const weight: PageWeight = {
  route: "/",
  document: { bytes: 5000, gzip: 1800 },
  styles: { bytes: 3000, gzip: 900 },
  scripts: { bytes: 120000, gzip: 41200 },
  elsewhere: [],
  fellBack: [],
};

describe("what is over a page's budgets", () => {
  it("names each part over its budget, gzipped, and nothing for a part under or without one", () => {
    expect(overBudget(weight, { document: 2000, styles: 900, scripts: 40000 })).toEqual([
      "scripts is 41.2 kB gzipped, over its budget of 40.0 kB",
    ]);
    expect(overBudget(weight, { document: 1000, styles: 800 })).toEqual([
      "document is 1.8 kB gzipped, over its budget of 1.0 kB",
      "styles is 900 B gzipped, over its budget of 800 B",
    ]);
    expect(overBudget(weight, {})).toEqual([]);
  });
});
