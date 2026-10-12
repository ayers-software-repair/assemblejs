// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deadLink } from "@assemblejs/build";
import { linkedProject } from "../fixtures/linked-project.js";

describe("the first link along a path that leads nowhere", () => {
  const { root } = linkedProject(
    { "src/assemblies/cart/cart.html": "<p>cart</p>", "shared/tokens.css": ":root{}" },
    {
      "src/assemblies/cart/gone.css": "no-such-file.css",
      "src/assemblies/cart/theme.css": "../../../shared/tokens.css",
      "src/assemblies/lost": "no-such-directory",
      "src/api": "outside:no-such-directory",
    },
  );
  const at = (path: string): string => join(root, path);

  it("is the link itself, where it is the path asked about", () => {
    expect(deadLink(root, at("src/assemblies/cart/gone.css"))).toBe(
      at("src/assemblies/cart/gone.css"),
    );
  });

  it("is the link above, where the path asked about is beneath one", () => {
    expect(deadLink(root, at("src/assemblies/lost/lost.html"))).toBe(at("src/assemblies/lost"));
    expect(deadLink(root, at("src/api/time.api.ts"))).toBe(at("src/api"));
  });

  it("is nothing for a file, for a link that leads somewhere, and for a path not written yet", () => {
    expect(deadLink(root, at("src/assemblies/cart/cart.html"))).toBeUndefined();
    expect(deadLink(root, at("src/assemblies/cart/theme.css"))).toBeUndefined();
    expect(deadLink(root, at("src/assemblies/new/new.html"))).toBeUndefined();
    expect(deadLink(root, root)).toBeUndefined();
  });
});
