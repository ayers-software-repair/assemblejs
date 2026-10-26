// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Admit } from "@asmjs/core";

describe("what is asked for each placement of one of this server's assemblies", () => {
  it("takes the assembly's name and view, and answers at once or in time", async () => {
    const now: Admit = (name) => ({ admitted: name === "cart" });
    const later: Admit = async (_name, view) => ({ admitted: view === "wide" });
    expect(now("cart", "wide")).toEqual({ admitted: true });
    expect(await later("cart", "narrow")).toEqual({ admitted: false });
  });
});
