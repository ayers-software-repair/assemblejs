// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { findPlacements, opensRuntime } from "@assemblejs/core";
import type { PlacedAssembly } from "@assemblejs/core";

const assemblies = new Map<string, PlacedAssembly>([
  ["still", { views: ["default"], browserHalf: false }],
  ["live", { views: ["default"], browserHalf: true }],
]);
const placing = (template: string) => findPlacements(template);

describe("whether a page carries its own runtime", () => {
  it("does for a local placement with a browser half, and for nothing else", () => {
    expect(opensRuntime(placing('<assembly name="live"></assembly>'), {}, assemblies)).toBe(true);
    expect(opensRuntime(placing('<assembly name="still"></assembly>'), {}, assemblies)).toBe(false);
    expect(opensRuntime(placing('<assembly name="nope"></assembly>'), {}, assemblies)).toBe(false);
    expect(opensRuntime([], {}, assemblies)).toBe(false);
  });

  // A static view has no browser half of its own, and the one its child has still needs the
  // runtime: what a view's source is known to place counts, at any depth.
  it("does for a static assembly whose view is known to place one with a browser half", () => {
    const nested = new Map<string, PlacedAssembly>([
      ...assemblies,
      [
        "shell",
        { views: ["default"], browserHalf: false, placements: { default: [{ name: "panel" }] } },
      ],
      [
        "panel",
        { views: ["default"], browserHalf: false, placements: { default: [{ name: "live" }] } },
      ],
      [
        "quiet",
        { views: ["default"], browserHalf: false, placements: { default: [{ name: "still" }] } },
      ],
    ]);
    expect(opensRuntime(placing('<assembly name="shell"></assembly>'), {}, nested)).toBe(true);
    expect(opensRuntime(placing('<assembly name="quiet"></assembly>'), {}, nested)).toBe(false);
  });

  // Boot knows what was read of a view's source and nothing more. A view with no record may
  // hold a browser half when it renders, and no rule of the page can count on that one.
  it("does not for a static assembly with no record of what its view places", () => {
    const unread = new Map<string, PlacedAssembly>([
      ...assemblies,
      ["shell", { views: ["default"], browserHalf: false }],
    ]);
    expect(opensRuntime(placing('<assembly name="shell"></assembly>'), {}, unread)).toBe(false);
  });

  it("does not for another server's assembly, whose runtime is that server's", () => {
    const place = { live: { url: "https://other.example/assembly/live/" } };
    expect(opensRuntime(placing('<assembly name="live"></assembly>'), place, assemblies)).toBe(
      false,
    );
  });
});
