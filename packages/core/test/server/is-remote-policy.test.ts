// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isRemotePolicy } from "@assemblejs/core";

describe("whether policy places a name from another server", () => {
  it("is an entry that is an object with a url, and nothing else", () => {
    const place = {
      far: { url: "https://other.example/assembly/far/" },
      near: { defer: true },
      odd: "not an object",
      nothing: null,
    };
    expect(isRemotePolicy(place, "far")).toBe(true);
    expect(isRemotePolicy(place, "near")).toBe(false);
    expect(isRemotePolicy(place, "odd")).toBe(false);
    expect(isRemotePolicy(place, "nothing")).toBe(false);
    expect(isRemotePolicy(place, "absent")).toBe(false);
  });
});
