// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { heldAssemblies } from "@assemblejs/core";
import type { Diagnostic } from "@assemblejs/core";

const placed = (
  name: string,
  source: Diagnostic["source"] = "local",
  children?: readonly Diagnostic[],
): Diagnostic => ({
  name,
  view: "default",
  id: `id-${name}`,
  source,
  ms: 1,
  ...(children === undefined ? {} : { children }),
});

describe("the assemblies whose content an answer holds", () => {
  it("are every one its view placed, at any depth, each once, however it was answered", () => {
    const nested = [
      placed("badge", "local", [placed("balance"), placed("avatar", "remote")]),
      placed("badge"),
      placed("notice", "fallback"),
      { ...placed("badge"), view: "compact" },
    ];
    expect(heldAssemblies(nested)).toEqual([
      { name: "badge", view: "default" },
      { name: "balance", view: "default" },
      { name: "avatar", view: "default" },
      { name: "notice", view: "default" },
      { name: "badge", view: "compact" },
    ]);
  });

  it("are none for an answer whose view placed nothing, and not one the browser fills later", () => {
    expect(heldAssemblies(undefined)).toEqual([]);
    expect(heldAssemblies([])).toEqual([]);
    expect(heldAssemblies([placed("reviews", "deferred"), placed("cart")])).toEqual([
      { name: "cart", view: "default" },
    ]);
  });
});
