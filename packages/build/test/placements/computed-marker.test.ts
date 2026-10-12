// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPUTED_MARKER } from "@assemblejs/build";

describe("what stands where a template computes", () => {
  it("is one segment, so a directive or an attribute holding it still reads", () => {
    expect(COMPUTED_MARKER).toMatch(/^[a-z][a-z0-9-]*$/);
  });
});
