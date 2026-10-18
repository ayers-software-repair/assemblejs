// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { formatWeight } from "@assemblejs/check";
import type { PageWeight } from "@assemblejs/check";

const weight: PageWeight = {
  route: "/shop",
  document: { bytes: 999, gzip: 400 },
  styles: { bytes: 1500, gzip: 600 },
  scripts: { bytes: 31_250, gzip: 10_049 },
  mount: { bytes: 218_000, gzip: 70_000 },
  assemblies: 3,
  total: { bytes: 250_749, gzip: 81_049 },
  elsewhere: [],
  fellBack: [],
};

describe("a page's weight as one line", () => {
  it("names the route, then each part before anything mounts, what mounting fetches, and the total", () => {
    expect(formatWeight(weight)).toBe(
      "/shop  document 999 B (400 B gzip)  styles 1.5 kB (600 B gzip)  scripts 31.3 kB (10.0 kB gzip)  on mount 3 assemblies 218.0 kB (70.0 kB gzip)  total 250.7 kB (81.0 kB gzip)",
    );
  });

  it("says assembly of one, and names the address a page with a parameter was weighed at", () => {
    expect(
      formatWeight({ ...weight, route: "/p/:sku", address: "/p/kettle-1", assemblies: 1 }),
    ).toMatch(/^\/p\/:sku \(\/p\/kettle-1\) {2}document .* on mount 1 assembly 218\.0 kB /);
  });
});
