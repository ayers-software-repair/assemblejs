// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OWN_DATA_SOURCE } from "@assemblejs/core";

describe("how a view's own data is named in a schema problem", () => {
  it("reads as a phrase in a sentence", () => {
    expect(OWN_DATA_SOURCE).toBe("the view's own data");
  });
});
