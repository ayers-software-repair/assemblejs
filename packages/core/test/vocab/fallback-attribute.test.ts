// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { ENVELOPE_ATTRIBUTE, FALLBACK_ATTRIBUTE, ISLAND_ATTRIBUTE } from "@asmjs/core";

describe("the attribute on a deferred envelope's fallback", () => {
  it("is a data attribute of its own, neither the envelope's nor the island's", () => {
    expect(FALLBACK_ATTRIBUTE).toMatch(/^data-[a-z]+$/);
    expect([...Object.values(ENVELOPE_ATTRIBUTE), ISLAND_ATTRIBUTE]).not.toContain(
      FALLBACK_ATTRIBUTE,
    );
  });
});
