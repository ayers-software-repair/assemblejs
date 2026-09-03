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

// Each of the following was found by an adversarial verification pass.
describe("directives the finder used to get wrong", () => {
  it("recognises the tag whatever its case, because HTML tag names are case insensitive", () => {
    // It was previously not a directive at all: copied to the output verbatim, no diagnostic.
    expect(findPlacements(`<ASSEMBLY name="cart"/>`)).toHaveLength(1);
    expect(findPlacements(`<Assembly name="cart"/>`)[0]?.name).toBe("cart");
  });

  it("ignores a directive inside a comment", () => {
    expect(findPlacements(`<!-- <assembly name="cart"/> -->`)).toEqual([]);
    expect(findPlacements(`<!--\n  <assembly name="cart"/>\n-->`)).toEqual([]);
    // And still finds the live one beside it.
    expect(
      findPlacements(`<!-- <assembly name="old"/> --><assembly name="new"/>`).map((p) => p.name),
    ).toEqual(["new"]);
  });

  it("refuses a name that would collide with another assembly's identity", () => {
    // identity("a/b", "c") and identity("a", "b/c") were both "a/b/c", so one assembly's
    // content could be served into the other's placement, and from its cache key.
    expect(() => findPlacements(`<assembly name="a/b" view="c"/>`)).toThrow(/usable url segment/);
    expect(() => findPlacements(`<assembly name="a" view="b/c"/>`)).toThrow(/usable url segment/);
  });

  it("refuses a name that could never be a declared assembly", () => {
    for (const bad of ["Cart", "1cart", "cart name", "../etc/passwd", "cart,other"]) {
      expect(() => findPlacements(`<assembly name="${bad}"/>`)).toThrow(/usable url segment/);
    }
  });
});
