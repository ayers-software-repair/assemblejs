// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW } from "@assemblejs/core";

describe("the default view", () => {
  it("has a name, so a view is never the absence of one", () => {
    expect(DEFAULT_VIEW).toBe("default");
  });
});
