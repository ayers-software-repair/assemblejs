// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { PAGE_BUS_KEY } from "@asmjs/core/client";

describe("where the page's bus is kept", () => {
  it("is a registered symbol, so a second copy of the module reads the same key", () => {
    expect(PAGE_BUS_KEY).toBe(Symbol.for("assemblejs.page-bus"));
  });
});
