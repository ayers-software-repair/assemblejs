// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { slot } from "@assemblejs/renderer-svelte/client";

describe("placing a child assembly", () => {
  it("answers the directive the composer replaces, for a component to write with {@html}", () => {
    expect(slot("inner")).toBe('<assembly name="inner"></assembly>');
    expect(findPlacements(`<section>${slot("price", "compact")}</section>`)).toMatchObject([
      { name: "price", view: "compact" },
    ]);
  });

  // The one thing a Svelte assembly writes with {@html} is the directive, built from segments.
  it("refuses a name that is not a segment, rather than answer it as markup", () => {
    expect(() => slot('x"><script>alert(1)</script>')).toThrow(/not a usable url segment/);
  });
});
