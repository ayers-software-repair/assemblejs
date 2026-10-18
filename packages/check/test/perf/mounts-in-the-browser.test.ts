// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { mountsInTheBrowser } from "@assemblejs/check";

describe("whether an envelope's assembly is mounted by the browser", () => {
  it("is for every mode but none, and for an envelope that names none", () => {
    expect(mountsInTheBrowser({ "data-name": "cart" })).toBe(true);
    expect(mountsInTheBrowser({ "data-mount": "" })).toBe(true);
    for (const mode of ["load", "idle", "visible"]) {
      expect(mountsInTheBrowser({ "data-mount": mode }), mode).toBe(true);
    }
    expect(mountsInTheBrowser({ "data-mount": "none" })).toBe(false);
  });

  it("is not for a mode the runtime does not know, as the runtime reads it", () => {
    expect(mountsInTheBrowser({ "data-mount": "sometime" })).toBe(false);
  });
});
