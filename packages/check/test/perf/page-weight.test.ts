// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PageWeight } from "@assemblejs/check";

describe("what one page sends a visitor", () => {
  it("is its document, its stylesheets and its scripts, then what its assemblies fetch as they mount, and the total", () => {
    const none = { bytes: 0, gzip: 0 };
    const weight: PageWeight = {
      route: "/",
      document: none,
      styles: none,
      scripts: none,
      mount: none,
      assemblies: 0,
      total: none,
      elsewhere: [],
      fellBack: [],
    };
    expect(Object.keys(weight)).toEqual([
      "route",
      "document",
      "styles",
      "scripts",
      "mount",
      "assemblies",
      "total",
      "elsewhere",
      "fellBack",
    ]);
  });
});
