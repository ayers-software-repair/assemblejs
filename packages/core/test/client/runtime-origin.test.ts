// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { runtimeOrigin } from "../../src/client/runtime-origin.js";

describe("the origin a bundle's runtime was started for", () => {
  it("is unset until a runtime starts", () => {
    expect(runtimeOrigin.current).toBeUndefined();
  });
});
