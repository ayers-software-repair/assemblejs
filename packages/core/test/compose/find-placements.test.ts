// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { findPlacements } from "@assemblejs/core";

describe("finding placements in a template", () => {
  it("finds each one in the order it appears, with where it sits", () => {
    const template = `<main><assembly name="a"></assembly><assembly name="b"/></main>`;
    const found = findPlacements(template);
    expect(found.map((p) => p.name)).toEqual(["a", "b"]);
    expect(template.slice(found[0]!.start, found[0]!.end)).toBe(`<assembly name="a"></assembly>`);
    expect(template.slice(found[1]!.start, found[1]!.end)).toBe(`<assembly name="b"/>`);
  });

  it("defaults the view, and reads one when it is written", () => {
    expect(findPlacements(`<assembly name="cart"/>`)[0]?.view).toBe("default");
    expect(findPlacements(`<assembly name="cart" view="compact"/>`)[0]?.view).toBe("compact");
  });

  it("finds nothing in a template with no placements", () => {
    expect(findPlacements("<main><p>hello</p></main>")).toEqual([]);
  });

  // Each of the following is a template the composer must refuse rather than half-understand.
  // A directive that is silently dropped is found by a visitor; one that is refused is found
  // by whoever wrote it.
  it("refuses a placement with no name", () => {
    expect(() => findPlacements(`<assembly/>`)).toThrow(/has no name/);
    expect(() => findPlacements(`<assembly name=""/>`)).toThrow(/has no name/);
  });

  it("refuses an attribute this version does not understand", () => {
    expect(() => findPlacements(`<assembly name="cart" timeout="5"/>`)).toThrow(
      /unknown attribute "timeout"/,
    );
  });

  it("refuses an attribute it cannot read, rather than ignoring it", () => {
    expect(() => findPlacements(`<assembly name="cart" defer/>`)).toThrow(/cannot read/);
  });

  it("refuses a directive that is neither self-closing nor immediately closed", () => {
    expect(() => findPlacements(`<assembly name="cart">text</assembly>`)).toThrow(
      /neither self-closing nor immediately closed/,
    );
  });
});
