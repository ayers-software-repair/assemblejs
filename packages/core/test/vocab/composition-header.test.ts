// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPOSITION_HEADER } from "@assemblejs/core";

describe("the composition headers", () => {
  it("are four, all under one prefix", () => {
    const names = Object.values(COMPOSITION_HEADER);
    expect(names).toHaveLength(4);
    expect(names.every((name) => name.startsWith("assembly-"))).toBe(true);
  });

  it("are lower case, because a header name is compared that way", () => {
    for (const name of Object.values(COMPOSITION_HEADER)) {
      expect(name).toBe(name.toLowerCase());
    }
  });
});
