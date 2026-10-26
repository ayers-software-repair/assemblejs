// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { overBudget } from "@asmjs/check";
import type { PageWeight } from "@asmjs/check";

const weight: PageWeight = {
  route: "/",
  document: { bytes: 5000, gzip: 1800 },
  styles: { bytes: 3000, gzip: 900 },
  scripts: { bytes: 120000, gzip: 41200 },
  mount: { bytes: 600000, gzip: 218000 },
  assemblies: 3,
  total: { bytes: 728000, gzip: 262100 },
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

  it("holds what the assemblies fetch as they mount, and the total, to the budgets given for them", () => {
    expect(overBudget(weight, { mount: 200000, total: 262100 })).toEqual([
      "mount is 218.0 kB gzipped, over its budget of 200.0 kB",
    ]);
    expect(overBudget(weight, { scripts: 50000, mount: 218000, total: 250000 })).toEqual([
      "total is 262.1 kB gzipped, over its budget of 250.0 kB",
    ]);
  });
});
