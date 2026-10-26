// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPOSITION_HEADER, RESPONSE_HEADER } from "@asmjs/core";

describe("the headers a content answer carries", () => {
  it("are two, under the prefix the request's headers have", () => {
    const names = Object.values(RESPONSE_HEADER);
    expect(names).toEqual(["assembly-name", "assembly-version"]);
    expect(names.every((name) => name.startsWith("assembly-"))).toBe(true);
  });

  it("are lower case, and none is a name a request sends", () => {
    for (const name of Object.values(RESPONSE_HEADER)) {
      expect(name).toBe(name.toLowerCase());
      expect(Object.values(COMPOSITION_HEADER)).not.toContain(name);
    }
  });
});
